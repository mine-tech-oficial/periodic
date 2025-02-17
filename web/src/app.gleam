import gleam/int
import gleam/list
import gleam/result
import helpers/date
import lustre
import lustre/attribute
import lustre/element/html
import lustre/event
import lustre/ui/button.{button}
import lustre/ui/card.{card}
import lustre/ui/input.{input}
import lustre/ui/theme

type Task {
  Task(name: String, time: date.DateTime(date.UTC), period: Int)
}

type Model {
  Model(
    tasks: List(Task),
    task_menu_open: Bool,
    task_name: String,
    task_time: date.DateTime(date.UTC),
    task_period: Int,
  )
}

type Msg {
  UserOpenedTaskMenu
  UserClosedTaskMenu
  UserUpdatedTaskName(String)
  UserUpdatedTaskTime(String)
  UserUpdatedTaskPeriod(String)
  UserAddedTask
  UserDeletedTask(Task)
}

pub fn main() {
  let app =
    lustre.simple(init, update, fn(model) {
      theme.inject(theme.default(), fn() { view(model) })
    })
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

fn init(_) {
  Model([], False, "", date.now(), 0)
}

fn update(model: Model, msg: Msg) {
  case msg {
    UserOpenedTaskMenu -> Model(..model, task_menu_open: True)
    UserClosedTaskMenu -> Model(..model, task_menu_open: False)
    UserUpdatedTaskName(input) -> Model(..model, task_name: input)
    UserUpdatedTaskTime(input) ->
      Model(
        ..model,
        task_time: result.unwrap(
          result.map(date.parse_localized_datetime(input), date.to_utc),
          date.now(),
        ),
      )
    UserUpdatedTaskPeriod(input) ->
      Model(..model, task_period: result.unwrap(int.parse(input), 0))
    UserAddedTask ->
      Model(
        tasks: [
          Task(
            name: model.task_name,
            time: date.next_period(model.task_time, model.task_period),
            period: model.task_period,
          ),
          ..model.tasks
        ],
        task_menu_open: False,
        task_name: "",
        task_time: date.now(),
        task_period: 0,
      )
    UserDeletedTask(task) ->
      Model(..model, tasks: list.filter(model.tasks, fn(t) { t != task }))
  }
}

fn view(model: Model) {
  html.div([], [
    html.h1([], [html.text("Periodic")]),
    html.div(
      [],
      list.map(model.tasks, fn(task) {
        card([card.round(), card.padding(theme.spacing.md, theme.spacing.md)], [
          card.content([], [
            html.text(task.name),
            html.text(
              date.to_string(
                date.to_localized(date.next_period(task.time, task.period)),
              ),
            ),
            button([event.on_click(UserDeletedTask(task)), button.icon()], [
              html.text("x"),
            ]),
          ]),
        ])
      }),
    ),
    button([event.on_click(UserOpenedTaskMenu), button.icon()], [html.text("+")]),
    ..case model.task_menu_open {
      True -> [
        input([event.on_input(UserUpdatedTaskName)]),
        input([
          event.on_input(UserUpdatedTaskTime),
          attribute.type_("datetime-local"),
        ]),
        input([event.on_input(UserUpdatedTaskPeriod), attribute.type_("number")]),
        button([event.on_click(UserAddedTask)], [html.text("Add")]),
      ]
      False -> []
    }
  ])
}

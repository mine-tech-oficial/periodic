import gleam/dynamic/decode
import gleam/int
import gleam/io
import gleam/json
import gleam/list
import gleam/result
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element/html
import lustre/event
import lustre/ui/button.{button}
import lustre/ui/card.{card}
import lustre/ui/input.{input}
import lustre/ui/theme
import plinth/browser/document
import plinth/browser/element
import rsvp
import shared/datetime
import shared/task.{type Task, Task}

pub type Model {
  Model(
    tasks: List(Task),
    task_menu_open: Bool,
    task_name: String,
    task_time: datetime.DateTime(datetime.UTC),
    task_period: Int,
  )
}

pub type Msg {
  UserOpenedTaskMenu
  UserClosedTaskMenu
  UserUpdatedTaskName(String)
  UserUpdatedTaskTime(String)
  UserUpdatedTaskPeriod(String)
  UserAddedTask
  UserDeletedTask(Task)
  ServerReturnedTasks(Result(List(Task), rsvp.Error))
}

pub fn main() {
  let json =
    document.query_selector("#model")
    |> result.map(element.inner_text)

  let flags = case
    json.parse(
      result.unwrap(json, ""),
      decode.at(["tasks"], decode.list(task.decoder())),
    )
  {
    Ok(tasks) -> tasks
    Error(_) -> []
  }
  io.debug(flags)
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", flags)

  Nil
}

fn init(flags) -> #(Model, Effect(Msg)) {
  #(Model(flags, False, "", datetime.now(), 0), effect.none())
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    UserOpenedTaskMenu -> #(Model(..model, task_menu_open: True), effect.none())
    UserClosedTaskMenu -> #(
      Model(..model, task_menu_open: False),
      effect.none(),
    )
    UserUpdatedTaskName(input) -> #(
      Model(..model, task_name: input),
      effect.none(),
    )
    UserUpdatedTaskTime(input) -> #(
      Model(
        ..model,
        task_time: result.unwrap(
          result.map(datetime.parse_localized_datetime(input), datetime.to_utc),
          datetime.now(),
        ),
      ),
      effect.none(),
    )
    UserUpdatedTaskPeriod(input) -> #(
      Model(..model, task_period: result.unwrap(int.parse(input), 0)),
      effect.none(),
    )
    UserAddedTask -> #(
      Model(
        tasks: [
          Task(
            name: model.task_name,
            time: datetime.next_period(model.task_time, model.task_period),
            period: model.task_period,
          ),
          ..model.tasks
        ],
        task_menu_open: False,
        task_name: "",
        task_time: datetime.now(),
        task_period: 0,
      ),
      effect.none(),
    )
    UserDeletedTask(task) -> #(
      Model(..model, tasks: list.filter(model.tasks, fn(t) { t != task })),
      effect.none(),
    )
    ServerReturnedTasks(Ok(tasks)) -> #(
      Model(..model, tasks: tasks),
      effect.none(),
    )
    ServerReturnedTasks(Error(_)) -> #(Model(..model, tasks: []), effect.none())
  }
}

pub fn view(model: Model) {
  theme.inject(theme.default(), fn() {
    html.div([], [
      html.h1([], [html.text("Periodic")]),
      html.div(
        [],
        list.map(model.tasks, fn(task) {
          card(
            [card.round(), card.padding(theme.spacing.md, theme.spacing.md)],
            [
              card.content([], [
                html.text(task.name),
                html.text(
                  datetime.to_string(
                    datetime.to_localized(datetime.next_period(
                      task.time,
                      task.period,
                    )),
                  ),
                ),
                button([event.on_click(UserDeletedTask(task)), button.icon()], [
                  html.text("x"),
                ]),
              ]),
            ],
          )
        }),
      ),
      button([event.on_click(UserOpenedTaskMenu), button.icon()], [
        html.text("+"),
      ]),
      ..case model.task_menu_open {
        True -> [
          input([event.on_input(UserUpdatedTaskName)]),
          input([
            event.on_input(UserUpdatedTaskTime),
            attribute.type_("datetime-local"),
          ]),
          input([
            event.on_input(UserUpdatedTaskPeriod),
            attribute.type_("number"),
          ]),
          button([event.on_click(UserAddedTask)], [html.text("Add")]),
        ]
        False -> []
      }
    ])
  })
}

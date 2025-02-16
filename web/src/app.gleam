import gleam/list
import lustre
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import lustre/ui/button.{button}
import lustre/ui/card.{card}
import lustre/ui/input.{input}
import lustre/ui/theme

type Task {
  Task(name: String)
}

type Model {
  Model(tasks: List(Task), task_menu_open: Bool, task_input: String)
}

type Msg {
  UserOpenedTaskMenu
  UserClosedTaskMenu
  UserUpdatedInput(String)
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
  Model([], False, "")
}

fn update(model: Model, msg: Msg) {
  case msg {
    UserOpenedTaskMenu -> Model(..model, task_menu_open: True)
    UserClosedTaskMenu -> Model(..model, task_menu_open: False)
    UserUpdatedInput(input) -> Model(..model, task_input: input)
    UserAddedTask ->
      Model(
        tasks: [Task(name: model.task_input), ..model.tasks],
        task_menu_open: False,
        task_input: "",
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
        input([event.on_input(UserUpdatedInput)]),
        button([event.on_click(UserAddedTask)], [html.text("Add")]),
      ]
      False -> []
    }
  ])
}

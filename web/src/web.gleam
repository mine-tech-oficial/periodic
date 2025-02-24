import gleam/dynamic/decode
import gleam/io
import gleam/json
import gleam/list
import gleam/result
import lustre
import lustre/effect.{type Effect}
import lustre/element
import lustre/element/html
import lustre/event
import lustre/ui/button.{button}
import lustre/ui/card.{card}
import lustre/ui/theme
import plinth/browser/document
import plinth/browser/element as e
import rsvp
import shared/datetime
import shared/task.{type Task, Task}
import web/task_input

pub type Model {
  Model(tasks: List(Task), task_input: task_input.Model)
}

pub type Msg {
  TaskInputMsg(task_input.Msg)
  UserDeletedTask(Task)
  ServerReturnedTasks(Result(List(Task), rsvp.Error))
}

pub fn main() {
  let json =
    document.query_selector("#model")
    |> result.map(e.inner_text)

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
  #(Model(flags, task_input.init()), effect.none())
}

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    TaskInputMsg(task_input.UserAddedTask) -> #(
      Model(
        tasks: [
          Task(
            name: model.task_input.task_name,
            time: datetime.next_period(
              model.task_input.task_time,
              model.task_input.task_period,
            ),
            period: model.task_input.task_period,
          ),
          ..model.tasks
        ],
        task_input: task_input.update(
          model.task_input,
          task_input.UserAddedTask,
        ),
      ),
      effect.none(),
    )
    TaskInputMsg(msg) -> #(
      Model(..model, task_input: task_input.update(model.task_input, msg)),
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
                element.map(task_input.view(model.task_input), TaskInputMsg),
              ]),
            ],
          )
        }),
      ),
    ])
  })
}

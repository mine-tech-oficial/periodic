import gleam/int
import gleam/result
import lustre/attribute
import lustre/effect.{type Effect}
import lustre/element/html
import lustre/event
import lustre/ui/button.{button}
import lustre/ui/input.{input}
import shared/datetime

pub type Model {
  Model(
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
}

pub fn init() -> Model {
  Model(False, "", datetime.now(), 0)
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserOpenedTaskMenu -> Model(..model, task_menu_open: True)
    UserClosedTaskMenu -> Model(..model, task_menu_open: False)
    UserUpdatedTaskName(input) -> Model(..model, task_name: input)
    UserUpdatedTaskTime(input) ->
      Model(
        ..model,
        task_time: result.unwrap(
          result.map(datetime.parse_localized_datetime(input), datetime.to_utc),
          datetime.now(),
        ),
      )
    UserUpdatedTaskPeriod(input) ->
      Model(..model, task_period: result.unwrap(int.parse(input), 0))
    UserAddedTask ->
      Model(
        task_menu_open: False,
        task_name: "",
        task_time: datetime.now(),
        task_period: 0,
      )
  }
}

pub fn view(model: Model) {
  html.div([], [
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

import gleam/dynamic/decode
import gleam/json
import shared/datetime

pub type Task {
  Task(name: String, time: datetime.DateTime(datetime.UTC), period: Int)
}

pub fn decoder() -> decode.Decoder(Task) {
  use name <- decode.field("name", decode.string)
  use time <- decode.field("time", datetime.decoder())
  use period <- decode.field("period", decode.int)
  decode.success(Task(name:, time:, period:))
}

pub fn to_json(task: Task) -> json.Json {
  json.object([
    #("name", json.string(task.name)),
    #("time", datetime.to_json(task.time)),
    #("period", json.int(task.period)),
  ])
}

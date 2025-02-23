import gleam/dynamic/decode
import lustre/effect.{type Effect}
import rsvp
import shared/task.{type Task}
import web/helper

pub fn get_tasks(
  to_msg: fn(Result(List(Task), rsvp.Error)) -> msg,
) -> Effect(msg) {
  rsvp.get(
    helper.hostname() <> "/api/tasks",
    rsvp.expect_json(decode.list(task.decoder()), to_msg),
  )
}

import birl
import birl/duration
import gleam/int
import gleam/order
import gleam/result
import gleam/string

pub type UTC

pub type Local

pub opaque type DateTime(a) {
  DateTime(time: birl.Time)
}

pub fn now() -> DateTime(UTC) {
  DateTime(time: birl.now())
}

pub fn parse_localized_datetime(
  datetime: String,
) -> Result(DateTime(Local), Nil) {
  birl.parse(datetime <> birl.get_offset(birl.now()))
  |> result.map(DateTime)
}

pub fn to_utc(datetime: DateTime(Local)) -> DateTime(UTC) {
  DateTime(time: result.unwrap(
    birl.set_offset(datetime.time, "Z"),
    datetime.time,
  ))
}

pub fn to_localized(datetime: DateTime(UTC)) -> DateTime(Local) {
  DateTime(time: result.unwrap(
    birl.set_offset(datetime.time, birl.get_offset(birl.now())),
    datetime.time,
  ))
}

pub fn to_string(datetime: DateTime(Local)) -> String {
  let birl.Day(year, month, day) = birl.get_day(datetime.time)
  let birl.TimeOfDay(hour, minute, _, _) = birl.get_time_of_day(datetime.time)

  let day = day |> int.to_string |> string.pad_start(2, "0")
  let month = month |> int.to_string |> string.pad_start(2, "0")
  let year = year |> int.to_string |> string.pad_start(4, "0")
  let hour = hour |> int.to_string |> string.pad_start(2, "0")
  let minute = minute |> int.to_string |> string.pad_start(2, "0")

  day <> "/" <> month <> "/" <> year <> " " <> hour <> ":" <> minute
}

pub fn next_period(date: DateTime(UTC), period: Int) -> DateTime(UTC) {
  case birl.compare(date.time, birl.utc_now()) {
    order.Lt ->
      next_period(DateTime(birl.add(date.time, duration.days(period))), period)
    _ -> date
  }
}

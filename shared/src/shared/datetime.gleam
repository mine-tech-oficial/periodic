import birl
import birl/duration
import gleam/dynamic/decode
import gleam/int
import gleam/json
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

pub fn decoder() -> decode.Decoder(DateTime(UTC)) {
  use erlang_datetime <- decode.then(erlang_datetime_decoder())
  let #(date, time) = erlang_datetime
  let datetime =
    birl.unix_epoch
    |> birl.set_day(birl.Day(date.0, date.1, date.2))
    |> birl.set_time_of_day(birl.TimeOfDay(time.0, time.1, time.2, 0))
  decode.success(DateTime(time: datetime))
}

fn erlang_datetime_decoder() -> decode.Decoder(
  #(#(Int, Int, Int), #(Int, Int, Int)),
) {
  use a <- decode.field(0, {
    use a <- decode.field(0, decode.int)
    use b <- decode.field(1, decode.int)
    use c <- decode.field(2, decode.int)

    decode.success(#(a, b, c))
  })
  use b <- decode.field(1, {
    use a <- decode.field(0, decode.int)
    use b <- decode.field(1, decode.int)
    use c <- decode.field(2, decode.int)

    decode.success(#(a, b, c))
  })

  decode.success(#(a, b))
}

fn to_erlang_datetime(
  datetime: DateTime(UTC),
) -> #(#(Int, Int, Int), #(Int, Int, Int)) {
  let birl.Day(year, month, day) = birl.get_day(datetime.time)
  let birl.TimeOfDay(hour, minute, second, _) =
    birl.get_time_of_day(datetime.time)

  #(#(year, month, day), #(hour, minute, second))
}

pub fn to_json(datetime: DateTime(UTC)) -> json.Json {
  let #(date, time) = to_erlang_datetime(datetime)
  json.array([[date.0, date.1, date.2], [time.0, time.1, time.2]], json.array(
    _,
    json.int,
  ))
}

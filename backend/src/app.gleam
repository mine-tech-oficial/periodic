import app/router
import gleam/erlang/process
import mist
import wisp/wisp_mist

pub fn main() {
  let secret_key_base = ""
  let assert Ok(_) =
    wisp_mist.handler(router.handle_request, secret_key_base)
    |> mist.new
    |> mist.port(8000)
    |> mist.start_http

  process.sleep_forever()
}

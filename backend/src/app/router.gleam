import app/database
import gleam/json
import lustre/attribute.{attribute}
import lustre/element.{element}
import lustre/element/html.{html}
import shared/task
import wisp.{type Request, type Response}

pub fn handle_request(req: Request) -> Response {
  let assert Ok(priv) = wisp.priv_directory("app")
  let static_dir = priv <> "/static"
  use <- wisp.serve_static(req, under: "/static", from: static_dir)
  case wisp.path_segments(req) {
    [] -> index()
    ["api", "tasks"] ->
      wisp.json_response(json.to_string_tree(json.array([], task.to_json)), 200)
    _ -> wisp.not_found()
  }
}

pub fn index() -> Response {
  let html =
    html([], [
      html.head([], [
        html.script(
          [attribute.type_("module"), attribute.src("/static/web.min.mjs")],
          "",
        ),
        html.script(
          [attribute.type_("application/json"), attribute.id("model")],
          json.object([
            #("tasks", json.array(database.get_tasks(), task.to_json)),
          ])
            |> json.to_string,
        ),
      ]),
      html.body([], [html.div([attribute.id("app")], [])]),
    ])

  wisp.html_response(
    html
      |> element.to_document_string_builder,
    200,
  )
}

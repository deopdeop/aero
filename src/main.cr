require "http/server"
require "http/client"
require "base64"

server = HTTP::Server.new do |context|
  HTTP::Client.options(context.request.path.lchop('/')) do |response|
    context.response.status_code = response.status_code
    case response.headers["Content-Type"].split(';')[0]
    when "text/html"
      body = "
        <script>
            let cors;

            #{File.read("_window.js")}

            document.write(atob('#{Base64.strict_encode(response.body)}'));
        </script>
        "
    when "application/javascript" || "application/x-javascript" || "text/javascript"
      body = "
        (function (window) {
            delete _window;

            #{response.body}
        }({ ...window, ..._window }));
        "
    when "application/json"
    end
    puts body
    context.response.print body
  end
end

server.listen(80)

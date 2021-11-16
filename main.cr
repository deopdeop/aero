require "http/server"
require "http/client"
require "uri"

server = HTTP::Server.new do |context|
    HTTP::Client.options(context.request.path.lchop('/'), headers: context.request.headers) do |response|
        context.response.status_code = response.status_code
        case response.headers["Content-Type"]
        when "text/html"
            context.response.print  "
            <script>
                let cors = ...;

                const _window = #{File.read("_window.js")}

                document.write('atob(#{Base64.strict_encode(body)}))')
            </script>
            "
        when "application/javascript"
            context.response.print "
            (function (window) {
                delete _window;

                #{body}
            }({ ...window, ..._window }));
            "
        end
    end
end

server.listen(80)
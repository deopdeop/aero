require "http/server"
require "http/client"
require "socket"
require "openssl"
require "json"
require "base64"

macro rewrite_url(url)
  "#{context.request.headers["host"]}/#{{{ url }}}"
  {% debug %}
end

server = HTTP::Server.new do |context|
  request_uri = context.request.path.lchop('/')
  request_origin = request_uri.split('/')[2]
  request_url = request_uri.lchop("http").lchop('s').lchop("://")
  request_host = request_origin.first?

  request_headers = context.request.headers
  request_headers.host = request_host
  request_headers.referer = rewrite_url(request_headers.referer)
  request_headers.location = rewrite_url(request_headers.location)
  if {{ flag?(:debug) }}
    print(request_headers)
  end
  HTTP::Client.options(url, {headers: request_headers}) do |response|
    cors = Hash.new
    response.headers.each do |key, value|
      if key.in? "content-encoding", "timing-allow-origin", "x-frame-options"
        cors[key] = value
        next
      end
      request.response.headers[key] = value
    end

    context.response.status_code = response.status_code

    case response.headers["content-type"].split(';').first?
    when "text/html" || "text/x-html"
      body = "
        <script>
            let cors = #{cors.to_json};

            #{
            if {{ flag?(:debug)}}
              File.read("_window.js")
            else
              {{ read_file("_window.js") }}
            end
            }
    
            document.write(atob('#{Base64.strict_encode(response.body)}'));
        </script>
        "
    when "application/javascript" || "application/x-javascript" || "text/javascript"
      body = "
        (function (window) {
            delete _window;

            #{response.body}
        }({ window, ..._window }));
        "
    when "application/manifest+json"
      json = JSON.parse(response.body)
      # TODO: Rewrite
      body = json.to_json
    end
    context.response.print body
    if {{ flag?(:debug) }}
      print body
    end
end

ssl = OpenSSL::SSL::Context::Server.new
ssl.certificate_chain = ARGV[1]
ssl.private_key = ARGV[2]

server.bind_tls "127.0.0.1", ARGV[0], context

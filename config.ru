require 'rubygems'
# require './app'

# run Sinatra::Application

map '/' do
  run Rack::Directory.new('./')
end

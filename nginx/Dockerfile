FROM nginx:latest

# COPY dist /usr/nginx/html
# RUN chmod -R 777 /usr/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
# COPY ssl.crt /usr/nginx/
# COPY ssl.pass /usr/nginx/
# COPY ssl.key /usr/nginx/

EXPOSE 80
ENTRYPOINT nginx -g 'daemon off;'
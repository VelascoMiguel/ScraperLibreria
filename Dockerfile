FROM ghcr.io/puppeteer/puppeteer:22.4.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/google-chrome
ENV NODE_ENV production

WORKDIR /app

COPY . .

RUN npm i

CMD ["node", "index.js"]

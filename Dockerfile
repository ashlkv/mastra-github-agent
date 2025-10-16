FROM node:20-alpine

ARG OPENAI_API_KEY
ARG GITHUB_TOKEN

ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV GITHUB_TOKEN=$GITHUB_TOKEN

EXPOSE 4111

WORKDIR /usr/src/app/

COPY package.json package-lock.json .

RUN npm install

COPY tsconfig.json .env .
COPY src ./src

# Serving mastra production build appears to be broken
# both inside and outside the container
#RUN npm run build
#CMD ["npm", "run", "start"]

CMD ["npm", "run", "dev"]

FROM node:16

WORKDIR /opt/reports

#copy package.json file
COPY package.json /opt/reports

#install fonts
RUN apt update && apt install fonts-indic -y \
    && fc-cache -f 

#install node packges
RUN npm install

#copy all files 
COPY . /opt/reports

#expose the application port
EXPOSE 3000

#start the application
CMD node app.js

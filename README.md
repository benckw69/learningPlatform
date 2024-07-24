# Learning Platform
Web application using EJS, NodeJS, MongoDB

Fork from https://www.github.com/benckw69/ERB_project

## Tech that is used
**Backend**
- NodeJS
- Express
- MongoDB
- Passport
- Multer

**Frontend**
- HTML
- EJS
- JavaScript
- CSS

## Features
For students:
* Create your own account by email or Google login
* Edit personal information
* Choose from the courses.  Search the courses and view the introduction before buying
* Filter courses by name, category, course producer
* Enroll any courses you want to
* View all enrolled courses
* View the rating and leave a rating of the course
* Add money by using money tickets 

For teachers:
* Create your own account by email or Google login
* Edit personal information
* Make a new course
* Edit a course and delete the course by 'pending to delete'

For admin:
* Produce money tickets
* Edit personal information

## Features to be added
* ~~Admin: Control the percentage allotment of the courses~~(done)
* Admin: View the account delete records of teachers and students.  Can recover the delete records.
* ~~Teachers: View how many students enrolled the course~~(done)
* Teachers: Request withdrawal of money
* Adding a page to contact the admin
* Add footer

## Installation
To use this repository, [MongoDB](https://www.mongodb.com/try/download/community) has to be installed.
Firstly, clone this repository
```
git clone https://www.github.com/benckw69/learningPlatform
```
Then, navigate to the project folder
```
cd learningPlatform
```
After that, install dependencies
```
npm install
```

Add a file call '.env' at '/learningPlatform' and edit it.  Get and add google client id and google client secret from [Google API console](https://console.cloud.google.com/).
Enter a MongoDB server url.  You can use a local server by [installing it](https://www.mongodb.com/try/download/community). Add a server database name.
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
server_url=
server_db=
```
After all of this setups, you are able to run the server!
```
npm run monstart
```

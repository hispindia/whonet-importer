## WHONET to DHIS2 AMR Importer App with aggregate data to aggregated data-value

In the project directory, you can run:

### `npm install`
Install all packages

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

#Builds the app for production to the `build` folder.<br>
#It correctly bundles React in production mode and optimizes the build for the best performance.

#The build is minified and the filenames include the hashes.<br>
#Your app is ready to be deployed! <br>
#Log into your DHIS2 instance and upload the minified zip file

# branch and build process
git branch development
git checkout development
git push origin development

build process

npm install
npm i @hisp-amr/org-unit-tree
npm run build

# and change in index.html inside build foldar
#remove / from main.38444415.js and main.66a9db6c.css

# initila one 
# <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"><meta name="theme-color" content="#000000"><link rel="manifest" href="/manifest.json"><link rel="shortcut icon" href="/favicon.ico"><title>WHONET Importer</title><link href="/static/css/main.66a9db6c.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div><script type="text/javascript" src="/static/js/main.38444415.js"></script></body></html>

# changed one
# <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"><meta name="theme-color" content="#000000"><link rel="manifest" href="/manifest.json"><link rel="shortcut icon" href="/favicon.ico"><title>WHONET Importer</title><link href="static/css/main.66a9db6c.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div><script type="text/javascript" src="static/js/main.38444415.js"></script></body></html>


import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Container } from 'reactstrap';
import NavBar from './layout/Navbar';
import ErrorMessage from './components/ErrorMessage';
import config from './config';
import { UserAgentApplication } from 'msal';
import Welcome from './Welcome';
import Calendar from './Calendar';

import 'bootstrap/dist/css/bootstrap.css';
import { getUserDetails } from './services/GraphService';

class App extends Component {
  constructor(props) {
    super(props);
    this.userAgentApplication = new UserAgentApplication({
      auth: {
        clientId: config.appId
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true
      }
    });

    let user = this.userAgentApplication.getAccount();

    this.state = {
      isAuthenticated: false,
      user: {},
      error: null
    };
    if (user) {
      this.getUserProfile();
    }
  }

  async login() {
    try {
      await this.userAgentApplication.loginPopup(
        {
          scopes: config.scopes,
          prompt: "select_account"
        });
      await this.getUserProfile();
    }
    catch (err) {
      var errParts = err.split('|');
      this.setState({
        isAuthenticated: false,
        user: {},
        error: { message: errParts[1], debug: errParts[0] }
      });
    }
  }

  async getUserProfile() {
    try {
      var accessToken = await this.userAgentApplication.acquireTokenSilent({
        scopes: config.scopes
      });

      if (accessToken) {

        var user = await getUserDetails(accessToken);
        console.log('user', user);
        this.setState({
          isAuthenticated: true,
          user: {
            displayName: user.displayName,
            email: user.mail || user.userPrincipalName
          },
          error: null
        });
      }
    }
    catch (err) {
      var error = {};
      if (typeof (err) === 'string') {
        var errParts = err.split('|');
        error = errParts.length > 1 ?
          { message: errParts[1], debug: errParts[0] } :
          { message: err };
      } else {
        error = {
          message: err.message,
          debug: JSON.stringify(err)
        };
      }

      this.setState({
        isAuthenticated: false,
        user: {},
        error: error
      });
    }
  }

  logout = () => {
    this.userAgentApplication.logout();
  }

  render() {
    let error = null;
    if (this.state.error) {
      error = <ErrorMessage message={this.state.error.message} debug={this.state.error.debug} />;
    }

    return (
      <Router>
        <div>
          <NavBar
            isAuthenticated={this.state.isAuthenticated}
            authButtonMethod={this.state.isAuthenticated ? this.logout : this.login.bind(this)}
            user={this.state.user} />
          <Container>
            {error}
            <Route exact path="/"
              render={(props) =>
                <Welcome {...props}
                  isAuthenticated={this.state.isAuthenticated}
                  user={this.state.user}
                  authButtonMethod={this.login.bind(this)} />
              } />
            <Route exact path="/calendar"
              render={(props) =>
                <Calendar {...props}
                  showError={this.setErrorMessage.bind(this)} />
              } />
          </Container>
        </div>
      </Router>
    );
  }

  setErrorMessage(message, debug) {
    this.setState({
      error: { message: message, debug: debug }
    });
  }
}

export default App;
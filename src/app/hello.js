import React, {Component} from 'react';
import moment from 'moment';

const CLIENT_ID = '408733066697-7bogjj4cf67ogaa87fo30ii7sjsgu38h.apps.googleusercontent.com';
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

export class Hello extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: "",
      subtime: "",
      events: null,

      isAuthed: null, // null: gapi not loaded, true: is authed, false: not authed
      calendarAPILoaded: false,

      updateTimeInterval: undefined,
      updateEventsInterval: undefined
    };
  }

  updateTime() {
    const now = moment();
    this.setState({
      time: now.format("h:mm"),
      subtime: now.format("dddd, MMMM Do")
    });
  }

  updateEvents() {
    if (!this.state.calendarAPILoaded) {
      return;
    }

    const request = window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: moment().toISOString(),
      timeMax: moment().endOf('day').toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 3,
      orderBy: 'startTime'
    });

    request.execute(resp => {
      this.setState({events: resp.items});
    });
  }

  checkAuthInit() {
    window.gapiLoaded.then(() => {
      window.gapi.auth.authorize({
        client_id: CLIENT_ID, // eslint-disable-line
        scope: SCOPES.join(' '),
        immediate: true
      }, this.handleAuth.bind(this));
    });
  }

  handleAuth(authResult) {
    if (authResult && !authResult.error) {
      this.setState({
        isAuthed: true
      });
      window.gapi.client.load('calendar', 'v3', () => {
        this.setState({
          calendarAPILoaded: true
        });
        this.updateEvents();
      });
    } else {
      this.setState({
        isAuthed: false
      });
    }
  }

  clickAuth() {
    window.gapi.auth.authorize({
      client_id: CLIENT_ID, // eslint-disable-line
      scope: SCOPES.join(' '),
      immediate: false
    }, this.handleAuth.bind(this));
  }

  componentWillMount() {
    // handle auth
    this.checkAuthInit();

    // update the time, every second
    this.setState({
      updateTimeInterval: window.setInterval(this.updateTime.bind(this), 1000)
    });
    this.updateTime();

    // update the events, every 10 mins
    this.setState({
      updateEventsInterval: window.setInterval(this.updateEvents.bind(this), 10 * 60 * 1000)
    });
  }

  componentWillUnmount() {
    window.clearInterval(this.state.updateTimeInterval);
    window.clearInterval(this.state.updateEventsInterval);
  }

  renderEvents() {
    if (this.state.isAuthed === true) {
      if (!this.state.events || this.state.events.length === 0) {
        return (
          <div className="noUpcomingEvents">
            No upcoming events.
          </div>
        );
      }

      const eventsHTML = [];
      for (let i = 0; i < this.state.events.length; i++) {
        const event = this.state.events[i];
        const eventTime = moment(event.start.dateTime || event.start.date);
        eventsHTML.push(
          <div className="event" style={{}}>
            <span className="eventTime">{eventTime.format("h:mma")}: </span>
              {event.summary}
              {event.location ? " (" + event.location + ")" : null}
          </div>
        );
      }
      return (
        <div className="eventsWrapper">
          {eventsHTML}
        </div>
      );
    }

    return (
      <div className="authWrapper">
        <a className="authButton" href="#" onClick={this.clickAuth.bind(this)}>Authenticate With Google to Show Upcoming Events</a>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="time">
          {this.state.time}
          <div className="subtime">
            {this.state.subtime}
          </div>
        </div>
        <div className="events">
          {this.renderEvents()}
        </div>
      </div>
    );
  }
}

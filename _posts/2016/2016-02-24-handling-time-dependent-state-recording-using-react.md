---
layout: post
title: 'Handling Time-Dependent State Recording using React'
meta: 'Learn how to handle time-dependent state recording in React, including event logging, playback, and state management for seamless user interaction tracking.'
tags: react javascript
---

Sometimes, you look at a feature request and think that it may be a very tricky implementation to develop.
I felt this way regarding recording input fields in a recent application I have been working on.
The idea was to be able to record a user's interaction with an HTML component (in this case, a textarea) and be able to replay these events (in real-time) at a later date.
Thinking about how I would go about creating such an implementation in trivial JavaScript, with all the browser nuances and user input differences, was not very appealing.

<!--more-->

## Enter React

Fortunately, we have recently added React into our stack, which, when applied to a problem domain such as this, made codifying a solution a breeze.
Instead of thinking of each intricate DOM event, I was able to reason about the problem on a higher level, alternatively thinking in terms of state changes.
All the boilerplate required to handle `onChange` events was already provided within the library.
Instead, I was able to take advantage of how React handles components' internal state for my own extra requirements.
The recording component documented below is really just logging each of the intermittent states that the component is in during its lifetime, in respect to its present value.
These state changes ('events') are stored along with their respective timestamp to provide the possibility for later time-dependent processing.

```js
class RecordableTextArea extends React.Component {
  state = { value: '', events: [] };

  clear() {
    this.setState({ value: '', events: [] });
  }

  getEvents() {
    return this.state.events;
  }

  _addEvent = e => {
    e.preventDefault();

    this.setState({
      value: e.target.value,
      events: [...this.state.events, [e.target.value, Date.now()]],
    });
  };

  render() {
    return (
      <textarea
        value={this.state.value}
        onChange={this._addEvent}
        {...this.props}
      />
    );
  }
}
```

## Handling Playback

Now that we had a log of the states the textarea was in throughout its lifetime, the next step was to be able to replay these events.
To achieve this, a small amount of processing needed to occur in transforming the event timestamps into relative durations, which could be used within the implementation.
With this in place, playback of each sequential event could be achieved by a simple `setTimeout` call, which applied the associated state change to the playback value output.

```js
class EventPlayback extends React.Component {
  timer;
  state = { value: '' };

  componentDidMount() {
    this._play(EventPlayback._process(this.props.events));
  }

  componentWillUnmount() {
    this._stop();
  }

  componentWillReceiveProps(nextProps) {
    this._stop();
    this._play(EventPlayback._process(nextProps.events));
  }

  static _process = events =>
    events.map(([value, timestamp], index, events) => {
      const [, nextTimestamp] = events[index + 1] || [, timestamp];
      return [value, nextTimestamp - timestamp];
    });

  _play = events => {
    if (events.length === 0) {
      return;
    }

    const [[value, duration], ...rest] = events;

    this.setState({ value });

    this.timer = setTimeout(() => this._play(rest), duration);
  };

  _stop = () => {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  };

  render() {
    return <div {...this.props}>{this.state.value}</div>;
  }
}
```

## Putting It All Together

To highlight how simple the implementation truly is, you can wire up the two components using the following component (demoable in [this JSBin](http://output.jsbin.com/mupucu)) and experiment with how it works.
This implementation is really a proof-of-concept in many regards, and further work could be done to make a more generic component that could handle all kinds of time-dependent state logging and eventual playback.

```js
class Demo extends React.Component {
  state = { events: [] };

  _onPlayback = e => {
    e.preventDefault();

    const { record } = this.refs;

    this.setState({ events: record.getEvents() });

    record.clear();
  };

  render() {
    return (
      <div>
        <RecordableTextArea ref="record" />
        <button onClick={this._onPlayback}>Playback</button>
        <EventPlayback events={this.state.events} />
      </div>
    );
  }
}
```

<img src="/uploads/handling-time-dependent-state-recording-using-react/state-recording.gif" style="width:auto;" />

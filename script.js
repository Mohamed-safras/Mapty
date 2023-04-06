'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const closebtn = document.querySelector('#close-form');
const filterWorkouts = document.querySelector('#filter-workouts');
const fiter_type = document.querySelector('#fiter-type');
const removeAllWorkouts = document.querySelector('#remove-all');
const add_workout = document.querySelector('#add_workout');
const update_workout = document.querySelector('#update_workout');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #isWorkOutOpen = false;
  constructor() {
    this._getPosition();

    // get data from localStorage
    this._getWorkoutsLocalStorage();

    //events
    add_workout.addEventListener('click', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    closebtn.addEventListener('click', this._hideForm);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
    containerWorkouts.addEventListener(
      'dblclick',
      this._removeWorkout.bind(this)
    );
    // remove_workout.addEventListener('click', this._removeWorkout.bind(this));
    containerWorkouts.addEventListener(
      'dblclick',
      this._updateWorkOut.bind(this)
    );

    removeAllWorkouts.addEventListener(
      'click',
      this._removeAllWorkouts.bind(this)
    );
    this._toggleRemoveBtn();
  }

  _getPosition() {
    navigator.geolocation &&
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        alert('location not found');
      });
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
    update_workout.style.display = 'none';
  }

  _newWorkout(e) {
    e.preventDefault();

    // validate the inputs
    const isNumber = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const isPositive = (...inputs) => inputs.every(input => input > 0);

    // get data from form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    console.log(type, distance);

    let workout;

    const { lat, lng } = this.#mapEvent.latlng;

    // if activity is running , add running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // validate the input
      if (
        !isNumber(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert('Input have to be positive');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // if activity is cycling , add cycling object
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      // validate the input
      if (
        !isNumber(distance, duration, elevationGain) ||
        !isPositive(distance, duration)
      )
        return alert('Input have to be positive');

      workout = new Cycling(distance, duration, [lat, lng], elevationGain);
    }

    this.#workouts.push(workout);

    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
    this._setWorkoutLoaclStore();
    this._toggleRemoveBtn();
  }

  _renderWorkoutMarker(workout) {
    const myIcon = L.icon({
      iconUrl: 'location-icon.png',
      iconSize: [25, 50],
      className: 'location_pin',
    });

    L.marker(workout?.coords, {
      icon: myIcon,
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          className: `${workout.type}-popup`,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent(`${workout.msg}`)
      .openPopup();
  }

  _renderWorkout({
    type,
    id,
    msg,
    distance,
    duration,
    pace,
    cadence,
    speed,
    elevationGain,
  }) {
    let html = `
          <li class="workout workout--${type}" data-id="${id}">
                <h2 class="workout__title">${msg}</h2>
                <div class="workout__details">
                  <span class="workout__icon">${
                    type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                  }</span>
                 <span class="workout__value">${distance}</span>
                  <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">⏱</span>
                  <span class="workout__value">${duration}</span>
                  <span class="workout__unit">min</span>
                </div>
          `;
    if (type === 'running') {
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${pace.toFixed(2)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${cadence}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>`;
    }
    if (type === 'cycling') {
      html += `
              <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${speed.toFixed(2)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${elevationGain}</span>
                <span class="workout__unit">spm</span>
             </div>
          </li>
          `;
    }

    containerWorkouts.insertAdjacentHTML('afterbegin', html);

    const workout = document.querySelectorAll('.workout');
    workout.forEach(item => {
      item.addEventListener('click', e => console.log(e));
    });
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _hideForm() {
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';
    form.classList.add('hidden');
    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 100);
  }

  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');
    const workoutId = workoutEl?.dataset?.id;
    if (!workoutId) return;

    const workout = this.#workouts.find(item => item.id === workoutId);

    this.#map?.flyTo(workout?.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setWorkoutLoaclStore() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getWorkoutsLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem('workouts'));

    if (!workouts) return;

    this.#workouts = workouts;

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

  _removeWorkout(e) {
    const workoutEl = e.target.closest('.workout');

    const workoutId = workoutEl?.dataset?.id;

    if (!workoutId) return;

    const workouts = this.#workouts.filter(workout => workout.id !== workoutId);

    this.#workouts = workouts;
    workoutEl.closest('ul').removeChild(workoutEl);
    form.style.display = 'none';
    this._setWorkoutLoaclStore();
    this._toggleRemoveBtn();
  }

  _removeAllWorkouts() {
    this.#workouts = [];

    containerWorkouts.querySelectorAll('.workout').forEach(workout => {
      containerWorkouts.removeChild(workout);
    });
    this._toggleRemoveBtn();
    this._hideForm();
    this._setWorkoutLoaclStore();
  }

  _toggleRemoveBtn() {
    this.#workouts.length > 0
      ? removeAllWorkouts.classList.add('active')
      : removeAllWorkouts.classList.remove('active');
  }

  _updateWorkOut(e) {
    const workoutEl = e.target.closest('.workout');
    const workoutId = workoutEl?.dataset?.id;

    if (!workoutId) return;

    let workout = this.#workouts.find(workout => workout.id === workoutId);
    console.log(workout);

    form.classList.remove('hidden');
    inputDistance.focus();
    update_workout.style.display = 'block';
    add_workout.style.display = 'none';

    inputDistance.value = workout.distance;
    inputType.value = workout.type;
    inputDuration.value = workout.duration;

    if (workout.type === 'running') {
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputCadence.value = workout.cadence;
    } else {
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation.value = workout.elevationGain;
    }

    update_workout.addEventListener('click', e => {
      e.preventDefault();

      const workouts = this.#workouts.filter(
        workout => workout.id !== workoutId
      );

      const workout = this.#workouts;

      this.#workouts = workouts;
      workout = {
        ...workout,
        distance: +inputDistance.value,
        duration: +inputDuration.value,
        type: inputType.value,
      };
      this.#workouts.push(workout);
      this._renderWorkout(workout);
      this._setWorkoutLoaclStore();
      form.classList.add('hidden');
    });
  }

  _toggleWorkOut() {}
}

const app = new App();

class Workout {
  date = new Date();
  id = this.date.getTime().toString().slice(-10);

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _displayTime() {
    this.msg = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} on ${new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
    }).format(this.date)}`;
    return this.msg;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);

    this.cadence = cadence;
    this.calcPace();
    this._displayTime();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._displayTime();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

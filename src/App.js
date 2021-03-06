// Author: Seunghun Oh
// This project displays a Google Maps from which you can draw polygons to calculate nominal power
// of the said polygon. This project also allows for searching of Google Maps Places

import React from "react";
import "./App.css";
import dot from "./resources/markerdot.png";
import { Map, Marker, Polygon, GoogleApiWrapper } from "google-maps-react";
import { geocodeByAddress, getLatLng } from "react-places-autocomplete";
import { API_key } from "./resources/config.js";
import { AppAutocomplete } from "./AppAutocomplete.js";
import { AppInfoButton } from "./AppInfoButton.js";
import { AppButton } from "./AppButton";

// Styling for the Google Maps, done here to make sure it is embedded
const mapStyle = {
  width: "75vw",
  height: "75vh",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
};

export class App extends React.Component {
  // Constructor containing the state
  constructor(props) {
    super(props);
    this.state = {
      currentCoord: {
        lat: null,
        lng: null,
      },

      polyCoords: [],
      address: "",
      loadModal: false,
    };
  }

  // On info button click, loads modal
  handleModalClose = () => {
    this.setState((prevState) => ({ loadModal: !prevState.loadModal }));
  };

  // Handle change in search bar by changing the appropriate state value
  handleChange = (address) => {
    this.setState({ address });
  };

  // Handle selection of an address in the autocomplete
  handleSelect = (address) => {
    geocodeByAddress(address)
      .then((results) => getLatLng(results[0]))
      .then((latLng) => {
        console.log("Success", latLng);
        this.setState({ currentCoord: latLng });
      })
      .catch((error) =>
        console.error("Error while retrieving coordinates", error)
      );
  };

  // handle the change in marker's coordinates after it is dragged
  changeMarkerCoord = (marker, newCoord) => {
    // replace marker.position from this.state.polyCoords with newCoord.latLng

    var tempPolyCoords = [...this.state.polyCoords];
    var idx = tempPolyCoords.indexOf(marker.position);

    console.log(idx);
    if (idx !== -1) {
      // change polyCoords state right here
      tempPolyCoords.splice(idx, 1, newCoord.latLng);
      this.setState({ polyCoords: tempPolyCoords });
    }
  };

  // Place marker with given parameter coordinates onto the Google Maps
  placeMarker = (coord) => {
    return (
      <Marker
        draggable
        icon={dot}
        position={coord}
        onDragend={(e, map, coord) => this.changeMarkerCoord(e, coord)}
      />
    );
  };

  // Finds the coordinates of newly places marker and adds it to the Map
  placeNewMarker = (mapProps, map, clickEvent) => {
    console.log(
      "Clicked coordinate: ",
      clickEvent.latLng.lat(),
      clickEvent.latLng.lng()
    );

    var coord = clickEvent.latLng;
    this.setState((prevState) => ({
      polyCoords: prevState.polyCoords.concat(coord),
    }));
  };

  // Places markers on the map to indicate draggable corners of nominal area polygon
  placePolyMarkers = () => {
    return this.state.polyCoords.map((coord) => {
      return this.placeMarker(coord);
    });
  };

  // Calculate the nominal power of the drawn polygon
  // Nominal power is calculated
  calcNominalPower = () => {
    var polyArea = this.props.google.maps.geometry.spherical.computeArea(
      this.state.polyCoords
    );
    return ((polyArea * 1000) / 1000000).toFixed(polyArea === 0 ? 0 : 2);
  };

  // Clear all polygon corner markers that have been placed on the map
  clearPolyCoords = () => {
    this.setState({ polyCoords: [] });
  };

  render() {
    return (
      <div className="app">
        <div className="appBody">
          <h4 id="title">SOLAR CELL INSTALLATION CALCULATOR</h4>
          <AppInfoButton
            handleModalClose={this.handleModalClose}
            loadModal={this.state.loadModal}
          />
          <div id="searchDiv">
            <AppAutocomplete
              address={this.state.address}
              handleChange={this.handleChange}
              handleSelect={this.handleSelect}
            />
            <AppButton
              buttonID={"clearMarkerButton"}
              onClick={this.clearPolyCoords}
            >
              Clear Map Markers
            </AppButton>
          </div>
          <Map
            className="googleMap"
            centerAroundCurrentLocation
            center={this.state.currentCoord}
            google={this.props.google}
            onReady={this.fetchPlaces}
            onClick={this.placeNewMarker}
            zoom={14}
            style={mapStyle}
          >
            {this.placePolyMarkers()}
            <Polygon
              paths={this.state.polyCoords}
              strokeColor="#FF0000"
              strokeOpacity={0.8}
              strokeWeight={2}
            />
          </Map>
          <footer id="footer">
            <h5 id={"powerNumber"}>
              NOMINAL POWER: {this.calcNominalPower()} MEGAWATTS
            </h5>
          </footer>
        </div>
      </div>
    );
  }
}

// Google API Wrapper to allow easy access to Google Cloud Platform access
export default GoogleApiWrapper({
  apiKey: API_key,
  libraries: ["geometry", "places"],
})(App);

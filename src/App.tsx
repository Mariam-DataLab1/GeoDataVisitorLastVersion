/**
 * Libs
 */

import * as LeafletUtils from "./leaflet";
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Reducer from "./reducer";


/**
 * UI
 */

import "./styles.scss";
import Loader from "./components/Loader";
import LayerSelectorPopup from "./components/LayerSelectorPopup";
import { useState } from "react";


/**
 * Assets
 */

import KadasterImg from "./assets/LogoKadaster.png";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import * as sBP from "./helpers/searchByPoint";

let _debug: any = (window as any)._debug || {};
(window as any)._debug = _debug;
const App: React.FC = () => {
  const [state, dispatch] = React.useReducer(
    Reducer.reducer,
    Reducer.initialState
  );


  _debug.state = state;
  _debug.dispatch = dispatch;

  /**
   * Effect that runs on-mount only
   */

  React.useEffect(() => {
    console.log();
    LeafletUtils.init({
      onZoomChange: (zoom) => {
        dispatch({ type: "zoomChange", value: zoom });
      },
      onContextSearch: (ctx) => {
        dispatch({ type: "coordinate_search_start", value: ctx });
      },
      onClick: (el) => {
        dispatch({ type: "selectObject", value: el });
      },
      onLayersClick: (info) => {
        dispatch({ type: "clickLayer", value: info });
      },
    });

    return () => {};
  }, []);

   /**
     * Trigger search
     //  */
  React.useEffect(() => {
    if (state.textSearchQuery && state.textSearchQuery.apiAddress && state.textSearchQuery.username && state.textSearchQuery.datasetName) {
      sBP
        .getFromTextSearch(state.textSearchQuery.apiAddress, state.textSearchQuery.username, state.textSearchQuery.datasetName)
        .then((res) => {
          dispatch({ type: "search_success", results: res as any });
        })
        .catch(() => {
          dispatch({ type: "search_error" });
        });
    }
  }, [state.textSearchQuery]);

  React.useEffect(() => {
    dispatch({
      type: "resetProperties",
      value: Object.keys(state.searchResults[0] || {}),
    });
  }, [state.searchResults]);

  React.useEffect(() => {
    if (state.selectedObject) {
      try {
        LeafletUtils.updateMap({
          selectedObject: state.selectedObject,
          updateZoom: false,
        });
      } catch {}
    } else {
      try {
        LeafletUtils.updateMap({
          updateZoom: false,
          searchResults: state.searchResults,
          properties: state.properties,
        });
      } catch (e) {}
    }
  }, [state.searchResults, state.properties, state.selectedObject]); 

  /**
   * Update leaflet when clustering setting changes
   */

  React.useEffect(() => {
    LeafletUtils.toggleClustering(state.mapClustered);
    LeafletUtils.updateMap({
      searchResults: state.searchResults,
      properties: state.properties,
      selectedObject: state.selectedObject,
      updateZoom: false,
    });
  }, [state.mapClustered, state.properties]);

  /**
   * input API
   */
  const defaultApiAddress = "https://api.labs.kadaster.nl/queries/BibiMaryam-SajjadianJaghargh/geo-object/run"
  const defaultUsername = "mariam"
  const defaultDatasetName = "sdoforADandPO" //test this datasets: sdogarden, sdoforsample3 kinder2
  const [apiAddress, setApiAddress] = useState(defaultApiAddress);
  const [username, setUsername] = useState(defaultUsername);
  const [datasetName, setDatasetName] = useState(defaultDatasetName);
  
  (window as any).apiAddress = defaultApiAddress
  
  return (
    <section className="App">
      <div className="headerInfo">
        <div className="headerEtc">
          <div className="header">
            <h2>GeodataVisitor</h2>
            <p>
              <a
                href="https://labs.kadaster.nl/demonstrators/"
                target="_blank"
                rel="noreferrer noopener"
              >
                <img
                  src={KadasterImg}
                  height="50"
                  style={{ marginBottom: "center" }}
                  alt="kadaster logo"
                />{" "}
              </a>
            </p>
          </div>
        </div>
        <div className="searchBar">
          <div className="infoContainer">
            <div className="apiContainer">
              <div>
              <span>API Address</span>
              <input
                value={apiAddress}
                style={{"height" : "30px", "width" : "225px"}}
                onChange={(e) => {
                  (window as any).apiAddress = e.target.value
                  setApiAddress(e.target.value)
                }
              }
              ></input>
              </div>
              <div className="usernameContainer">
              <span>Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              ></input>
              </div>
              <div className="datasetnameContainer">
              <span>Dataset Name</span>
              <input
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
              ></input>
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              dispatch({ type: "search_start", value: { apiAddress, username, datasetName } })
            }
          >
            Go
          </button>
        </div>
        <div className="KGs">
          <a
            href="https://data.labs.kadaster.nl/kadaster/knowledge-graph"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "black" }}
          >
            Knowldge Graph (KG)
          </a>
        </div>
        <div className="KGs">
          <a
            href="https://data.labs.kadaster.nl/kadaster/kg"
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "black" }}
          >
            Knowldge Graph (kg)
          </a>
        </div>
        <div className="KGs">
              <a
                href="https://labs.kadaster.nl/demonstrators/geodatawizard/"
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: "black" }}
              >
                GD Wizard
              </a>
            </div>
            <div className="KGs">
              <a
                href=".\src\assets\help\help.html"
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: "black" }}
              >
                Help
              </a>
            </div>
        <div className="list" style={{ overflow: "auto" }}> 
          <ul className="properties-list">
            {Object.entries(state.properties).map(([k, v]) => (
              <li
                key={k}
                className={"property " + (v ? "selected" : "")}
                onClick={() =>
                  dispatch({
                    type: "setProperties",
                    value: { ...state.properties, [k]: !state.properties[k] },
                  })
                } 
              >
                {k}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className={state.isFetching ? "mapHolderLoading" : "mapHolder"}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Loader loading={state.isFetching} />
        <div id="map" />
        <div id="zoomExtend"></div>
      </div>
      <LayerSelectorPopup
        handleClose={() => dispatch({ type: "closeClickedLayer" })}
        handleClick={(el) => {
          dispatch({ type: "selectObject", value: el });
        }}
        options={state.clickedLayer}
      />
      <ToastContainer />
    </section>
  );
};

export default App;

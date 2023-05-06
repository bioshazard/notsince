import React, { useEffect, useRef, useState } from "react";
import Gun from "gun";

// ## Functionality
//
// - Display activities
// - Filter displayed activities (by cadence)
// - Add activity
// - Edit activity
//
// ## Data Design
//
// - (activities > Call Mom {
//      details > {
//        name,
//        cadence,
//        last: events.$timestamp or TIMESTAMP duplicated...
//      }
//      events: [
//        <TIMESTAMP>
//        OR for more complex event details... 2023/04/23/13/02/37 -> { note: adsf... }
//      ]
//    })
//

const gun = Gun();
window.gun = gun;
// const db = gun.get('db').get('test').get( (new Date()).toISOString() ) // Fresh test on reload
const db = gun.get("db").get("since");
window.db = db;

function App() {
  // const effectCalled = useRef(false)
  const activities = db.get("activities"); // Needs to be in component for .on to pick up sub-field changes

  // https://medium.com/swlh/using-es6-map-with-react-state-hooks-800b91eedd5f
  const [activityMapState, setActivityMapState] = useState(new Map());
  const updateActivityMap = (k, v) => {
    setActivityMapState(new Map(activityMapState.set(k, v)));
  };

  // TODO: Use a modal
  const addActivityTest = () => {
    const activityName = prompt("Name?");
    const activityCadence = prompt("Cadence?", "1d");
    activities.get(activityName).get("cadence").put(activityCadence);
  };

  // console.log("DEBUG: Component log")

  // Given a data object from eg .on, resolve a list of fields if they have # souls
  const hydrateFields = async (data, fields) => {
    // Generate an array of promises from fields in data that contains a # nodePath
    const promises = fields
      .filter((field) => field in data && "#" in data[field])
      .map((field) => {
        const nodePath = data[field]["#"];
        return new Promise((resolve, reject) => {
          gun.get(nodePath).once((data) => {
            resolve({ field, data });
          });
        });
      });
    return Promise.all(promises).then((fieldUpdates, index) => {
      fieldUpdates.forEach((fieldUpdate) => {
        data[fieldUpdate.field] = fieldUpdate.data;
      });
      return data;
    });
  };

  const timeElapsed = (isoString) => {
    const timestamp = new Date(isoString);
    const now = new Date();
    const diff = now - timestamp;
    const hoursElapsed = Math.round(diff / (1000 * 60 * 60));
    const daysElapsed = Math.floor(hoursElapsed / 24);
    const roundedHours = hoursElapsed % 24;
    const formattedTime = `${daysElapsed}d${roundedHours}h`;
    return formattedTime;
  };
  window.timeElapsed = timeElapsed;

  useEffect(() => {
    // console.log("DEBUG: useEffect")

    // // https://dev.to/ag-grid/react-18-avoiding-use-effect-getting-called-twice-4i9e
    // if(!effectCalled.current) {
    //   effectCalled.current = true

    activities.map().on((data, key) => {
      if (data !== null) {
        // Skip tombstoned data
        hydrateFields(data, ["last"]).then((data) => {
          updateActivityMap(key, data);
        });
      }
    });
    // }

    return () => {
      console.log("DEBUG: useEffect > return");
      activities.map().off();
    };
  }, []);

  const activityDone = (name) => {
    console.log(`Did activity ${name}`);
    const now = new Date();
    const timestamp = now.toISOString();
    const lastCompletion = activities
      .get(name)
      .get("events")
      .get(timestamp)
      .put({
        note: "Activity Completed",
        timestamp: timestamp,
      });
    // Update convenience pointer to latest event
    activities.get(name).get("last").put(lastCompletion);
  };

  // Tombstone the activity
  const activityDelete = (name) => {
    console.log("delete");
    activities.get(name).put(null);
  };

  return (
    <div className="p-2">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <button
            className="float-right block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={addActivityTest}
          >
            Add Activity
          </button>
          <h3 className="text-lg leading-6 font-medium text-gray-900 py-2">
            My Activities
          </h3>
          <div className="clear-both"></div>
        </div>
        <ul className="divide-y divide-gray-200">
          {[...activityMapState.keys()].map((key, index) => {
            const activityName = key;
            const activityDetails = activityMapState.get(key);
            return (
              <li className="px-6 py-4" key={index}>
                <div className="flex items-center">
                  <div className="shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                    </svg>
                  </div>
                  <div className="grow ml-3">
                    <button
                      className="float-right block bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => activityDelete(key)}
                    >
                      Delete
                    </button>
                    <button
                      className="float-right block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mr-2 rounded"
                      onClick={() => activityDone(key)}
                    >
                      Done
                    </button>
                    <p className="text-sm font-medium text-gray-900">
                      ({activityDetails.cadence}) {activityName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Last:{" "}
                      {(activityDetails.last &&
                        timeElapsed(activityDetails.last.timestamp)) ||
                        "Never"}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;

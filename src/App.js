import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Gun from 'gun';

// ## Functionality
// 
// - Display activities
// - Filter displayed activities (by cadence)
// - Add activity
// - Edit activity
// 
// ## Data Design
// 
// - (activity: { 
//      name, 
//      cadence,
//      last: events.$timestamp or TIMESTAMP duplicated...
//      events: [
//        <TIMESTAMP>
//        OR for more complex event details... 2023/04/23/13/02/37 -> { note: adsf... }
//      ] 
//    })
//

const gun = Gun()
// const db = gun.get('db')
const db = gun.get('test').get('db-a')
window.db = db

function App() {
  
  const effectCalled = useRef(false)
  const [activityMapState, setActivityMapState] = useState(new Map());

  const activities = db.get('activities') // Needs to be in component for .on to pick up sub-field changes

  // https://medium.com/swlh/using-es6-map-with-react-state-hooks-800b91eedd5f
  const updateActivityMap = (k, v) => { setActivityMapState(new Map(activityMapState.set(k, v))) }

  const addActivityTest = () => {
    const activityName = (new Date()).toISOString()
    activities.get(activityName).get('cadence').put('1d')
  }

  console.log("DEBUG: Component log")

  useEffect( () => {
    console.log("DEBUG: useEffect")

    // https://dev.to/ag-grid/react-18-avoiding-use-effect-getting-called-twice-4i9e
    if(!effectCalled.current) {
      effectCalled.current = true
      activities.map().on( (data, key) => {
        console.log("DEBUG: useEffect > activities.map().on")
        console.log(data, key)
        updateActivityMap(key, data)
      })
    }

    // Might not even need this in practice
    return () => {
      console.log("DEBUG: useEffect > return")
      activities.map().off()
    }
  })

  // // { name, cadence, }
  // const addActivity = (name, details) => {
  //   console.log("Add Activitiy", name, details)
  //   activities.get(name).put(details)
  // }

  const activityDone = (name) => {
    console.log(`Did activity ${name}`)
    const now = new Date()
    const lastCompletion = activities.get(name)
      .get('events')
      .get(now.toISOString())
      .put({
        note: "Activity Completed"
      }
    )
    // Update convenience pointer to latest event
    activities.get(name).get('last').put(lastCompletion)
  }


  return (
    <div className="p-2">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <button className="float-right block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={addActivityTest}>Add Activity</button>
          <h3 className="text-lg leading-6 font-medium text-gray-900 py-2">My Activities</h3>
          <div className='clear-both'></div>
        </div>
        <ul className="divide-y divide-gray-200">
        {[...activityMapState.keys()].map( (key, index) => {
          const activityName = key
          const activityDetails = activityMapState.get(key)
          
          // Last event details
          console.log(activityDetails.last)
          const last = activityDetails.last ? activityDetails.last["#"] : "Never"





          return (
            <li className="px-6 py-4" key={index}>
              <div className="flex items-center">
                <div className="shrink-0">
                  <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                  </svg>
                </div>
                <div className="grow ml-3">
                  <button className="float-right block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => activityDone(key)}>Done</button>
                  <p className="text-sm font-medium text-gray-900">{activityName}</p>
                  <p className="text-sm text-gray-500">Cadence: {activityMapState.get(key).cadence}</p>
                  <p className="text-sm text-gray-500">Last: {last}</p>
                </div>
              </div>
            </li>
          )
        })}
        </ul>
      </div>

    </div>
  );
}

export default App;

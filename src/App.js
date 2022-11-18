import * as Realm from 'realm-web'
import { useEffect, useState } from 'react'
import _ from 'lodash'

import './App.css'

const app = new Realm.App({ id: process.env.REACT_APP_MONGO_APP_ID })

function App () {
  const [user, setUser] = useState()
  const [events, setEvents] = useState([])

  useEffect(() => {
    const login = async () => {
      // Authenticate anonymously
      const user = await app.logIn(Realm.Credentials.anonymous())
      setUser(user)

      // Connect to the database
      const mongodb = app.currentUser.mongoClient()
      const collection = mongodb.db(process.env.REACT_APP_MONGO_DB).collection(process.env.REACT_APP_MONGO_COLLECTION)

      // Everytime a change happens in the stream, add it to the list of events
      for await (const change of collection.watch()) {
        if (change.operationType === 'update') {
          setEvents(prevData => {
          // Make sure we don't add the same event twice
            if (prevData.length === 0 || (_.find(prevData, change) === undefined)) {
              return [...prevData, change]
            }
            return prevData
          })
        }
      }
    }
    login()
  }, [])

  return (
    <div className='App'>
      {!!user &&
        <div className='App-header'>
          <h1>Connected as user ${user.id}</h1>
          <div>
            <p>Latest events:</p>
            <table>
              <thead>
                <tr>
                  <td>Operation</td>
                  <td>Document Key</td>
                  <td>Full Document</td>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i}>
                    <td>{e.operationType}</td>
                    <td>{e.documentKey._id.toString()}</td>
                    <td>{JSON.stringify(e.fullDocument)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}
    </div>
  )
}

export default App

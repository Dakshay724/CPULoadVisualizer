import React, { useState, useEffect } from "react";
import socket from "./component/utilities/socketConnection";
import Widget from "./component/Widget";

function App() {
  const [performanceData, setPerformanceData] = useState({});

  useEffect(() => {
    socket.on("data", (data) => {
      const currentState = { ...performanceData };
      currentState[data.macA] = data;
      setPerformanceData(currentState);
    });
  }, [performanceData]);

  console.log(performanceData);

  const widgets = Object.entries(performanceData).map(([key, value]) => (
    <Widget key={key} data={value} />
  ));

  return <div className="App">{widgets}</div>;
}

export default App;

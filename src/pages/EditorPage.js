import React, { useState, useRef, useEffect } from "react";
import toast from 'react-hot-toast';
import Client from "../components/Client";
import Editor from "../components/Editor";
import ACTIONS from "../Actions";
import { initSocket } from "../socket";
import { useLocation, useNavigate ,Navigate, useParams} from 'react-router-dom'

const EditorPage = () => {

  const socketRef = useRef(null);
  const location = useLocation();
  const { roomId } =useParams();
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () =>{
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e) {
          console.log('socket error', e);
          toast.error('Socket connection failed, try again later.');
          reactNavigator('/');
      }

      socketRef.current.emit(ACTIONS.JOIN , {
        roomId,
        username: location.state?.username,
      });
      
      //Linstening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
            if (username !== location.state?.username) {
                toast.success(`${username} joined the room.`);
                console.log(`${username} joined`);
            }
            setClients(clients);

          }
       ); 
        // Listening for disconnected
        socketRef.current.on(
          ACTIONS.DISCONNECTED,
          ({ socketId, username }) => {
              toast.success(`${username} left the room.`);
              setClients((prev) => {
                  return prev.filter(
                      (client) => client.socketId !== socketId
                  );
              });
          }
      );

     }; 
         

    init();
    return () =>{
       socketRef.current.disconnect();
       socketRef.current.off(ACTIONS.JOINED);
       socketRef.current.off(ACTIONS.DISCONNECTED);

    }; 

  }, []);


 async function copyRoomId(){
   
     try{
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID has been copied to your clipboard');
     } catch(err){
        toast.error('Could not copy the Romm ID');
        console.log(err);
     }
}
 function leaveRoom()
{
   reactNavigator('/');
}
  
  
  if(!location.state){
    return <Navigate to="/" />

  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-sync.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>Copy ROOM ID</button>
        <button className="btn leaveBtn" onClick={leaveRoom}>Leave</button>
      </div>
      <div className="editorWrap">
        <Editor socketRef={socketRef} roomId={roomId} />
      </div>
    </div>
  );

};

export default EditorPage;

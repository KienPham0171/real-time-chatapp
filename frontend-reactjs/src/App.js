import SockJsClient from 'react-stomp';
import {useState,useEffect,useRef} from "react";
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useBeforeunload } from 'react-beforeunload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Stomp from 'stompjs';
import SockJs from 'sockjs-client';
import Modal from 'react-modal';


Modal.setAppElement('#root');

function App() {

  const SOCKET_URL= 'http://localhost:8080/ws-chat/';
  

  const [user,setUser] = useState({id: -1,userName:"Guest",avatarUrl:""});
  var token =sessionStorage.getItem("token"); 

  //test onlineUsers
  var onlineUsersTest = [
    {
    id: 2,
    userName: "Pham Van An",
    avatarUrl: "https://res.cloudinary.com/keinpham/image/upload/v1635670115/cwqjoxyqa4czmzdycdvd.jpg",
    },
    {
      id: 1,
      userName: "Kien Pham",
      avatarUrl: "https://res.cloudinary.com/keinpham/image/upload/v1639645473/o3iwugrjzipavwiukzci.jpg",
    },
          
]

  const cloneList = (arr) =>{
    return arr.map(user => {
      return {...user,isFocused: false};
    })
  }

  useBeforeunload((event) => {
    event.preventDefault();
    axios({
      method: "get",
      url: "http://localhost:8080/out",
      headers: {
        Authorization: `Bearer ${token}`
      }
      })
    
  });



  // state
  //add focus attribute before rendering
  const [onlineUsers,setOnlineUsers] = useState(cloneList(onlineUsersTest));
  const [listChatUsers,setListChatUsers] = useState([]);

  const [chatState,setChatState] = useState([]);


  useEffect( () =>{
     axios({
      method: "get",
      url: "http://localhost:8080/check-token",
      headers: {
        Authorization: `Bearer ${token}`
      }
      }).then(response =>{
      
      setUser(response.data);
      })
      .catch(err =>{
        setUser({
          id: -1,
          userName: "Guest",
          avatarUrl:""
        })
      });
    
    },[])

  
  
  const onConnected=()=>{
    console.log("Connected");
  }
  const onDisconnected = ()=>{
    console.log("Disconnected"); 
  }
  const onMessageReceived=(msg)=>{
    console.log("received: " ,msg);
    var sendUser = msg.sendUser;
    
    var check = false;
    if(chatState == [])check =false;
    else{
      chatState.forEach( obj =>{
        if(obj.targetUser === `targetUserId ${sendUser.id}`) check = true;
      })
    }

    if(!check){
      var content = null;
      
      if(msg.type=== "multipart"){
        content = msg.multipartUrl;
        
      }else{
        content = msg.message;
      }

      let oneMessage = {
        type: "received",
        message: {
          type: msg.type,
          content: content,
          timeStamp: new Date(msg.timeStamp)
        }
      };
      console.log("oneMessage: " , oneMessage);
      let temp = `targetUserId ${sendUser.id}`;

      let obj = {
        targetUser : temp,
        chatList : [oneMessage],
        // sendUser: `sendUserId ${user.id}`
      }
      let newChatState = [...chatState, obj];
      setChatState(newChatState);
    }else{
      var targetChat;
      chatState.forEach(obj =>{
        if(obj.targetUser == `targetUserId ${sendUser.id}`) targetChat = {...obj};
      })
      var content = null;
      if(msg.type=== "multipart"){
        content = msg.multipartUrl;
      }else{
        content = msg.message;
      }
      var chatList = targetChat.chatList;
      let newChatList = [...chatList,{
        type: "received",
        message: {
          type: msg.type,
          content: content,
          timeStamp: new Date(msg.timeStamp)
        }
      }]
      var newResult = {
        ...targetChat,
        chatList: newChatList,
      }
      var newChatState = chatState.map(obj =>{
        if(obj.targetUser === `targetUserId ${sendUser.id}`)return newResult;
        else return obj;
      })

      setChatState(newChatState);
      
    }
    onClickHandler(msg.sendUser);

  }
  const onLoginSuccess = user =>{
    setUser(user);
  }

  const onClickHandler = user =>{
    var isExisted = false;
    for(var i = 0 ; i< listChatUsers.length ; i++){
      if(listChatUsers[i].id == user.id) {
        isExisted = true
        listChatUsers[i].isFocused = true;
      }
      else{
        listChatUsers[i].isFocused = false;
      }
    }
    if(isExisted){

      var newListChatUsers = [...listChatUsers];
      setListChatUsers(newListChatUsers);
    }else{
      var newListChatUsers = [...listChatUsers,{...user,isFocused:true}];
      setListChatUsers(newListChatUsers);
    }
    
  }

   async function handlerSend(event,toId,file){
    var message = event.target.chatContent.value;
    var check = false;
    if(chatState == [])check =false;
    else{
      chatState.forEach( obj =>{
        if(obj.targetUser === `targetUserId ${toId}`) check = true;
      })
    }
    console.log("vao day : " ,"- file: ",file);
   
    //obj multipart data
    var newChatState = [...chatState];
    if(file!= null && file.size >0){
      
      const formData = new FormData();
      formData.append("multipartData",file);
      formData.append("sendId",user.id);
      formData.append("targetId",toId);
      formData.append("type", "multipart");


     
      var reader = new FileReader();
      var url = null;
      reader.onload = function (e) {
        url = e.target.result;
      };
      reader.readAsDataURL(file);

       var response =await axios({
        method: "post",
        url: "http://localhost:8080/multipart-message",
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'multipart/form-data'
        },
        data: formData,
        }).then(response =>{
          if(response.data == "Successfully"){
            if(!check){
              let oneMessage = {
                type: "sent",
                message: {
                  type: "multipart",
                  content: url,
                  timeStamp: new Date()
                }
              };
              let temp = `targetUserId ${toId}`;
        
              let obj = {
                targetUser : temp,
                chatList : [oneMessage],
                // sendUser: `sendUserId ${user.id}`
              }
              //newChatState = [...chatState, obj];
              newChatState = [...newChatState,obj];
              console.log("chat state lan1: ",newChatState);
              //setChatState(newChatState);
            }
            else{
              var targetChat;
              chatState.forEach(obj =>{
                if(obj.targetUser == `targetUserId ${toId}`) targetChat = {...obj};
              })
              var chatList = targetChat.chatList;
              let newChatList = [...chatList,{
                type: "sent",
                message: {
                  type: "multipart",
                  content: url,
                  timeStamp: new Date()
                } 
              }]
              
              var newResult = {
                ...targetChat,
                chatList: newChatList,
              }
              newChatState = newChatState.map(obj =>{
                if(obj.targetUser === `targetUserId ${toId}`)return newResult;
                else return obj;
              })

              // newChatState = chatState.map(obj =>{
              //   if(obj.targetUser === `targetUserId ${toId}`)return newResult;
              //   else return obj;
              // })
        
              //setChatState(newChatState);
              
            }
          }else{
            console.log("Send fail")
          }
        }).catch(ex=>{
          console.log(ex);
        })
      
    }
     





    if(message.trim() !== ""){
        // obj will go to the sever
    var toServer = {
      sendId: user.id,
      targetId: toId,
      message: message,
      type: "text"
    };

      response = await axios({
      method: "post",
      url: "http://localhost:8080/message",
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: toServer
      }).then(response =>{
        if(response.data == "Successfully"){
          if(!check){
            let oneMessage = {
              type: "sent",
              message: {
                type: "text",
                content: event.target.chatContent.value,
                timeStamp: new Date()
              }
            };
            let temp = `targetUserId ${toId}`;
      
            let obj = {
              targetUser : temp,
              chatList : [oneMessage],
              // sendUser: `sendUserId ${user.id}`
            }
            newChatState = [...newChatState,obj];
            console.log("chatState lan2: ",newChatState);
            //newChatState = [...chatState, obj];
            //setChatState(newChatState);
          }
          else{
            var targetChat;
            chatState.forEach(obj =>{
              if(obj.targetUser == `targetUserId ${toId}`) targetChat = {...obj};
            })
            var chatList = targetChat.chatList;
            let newChatList = [...chatList,{
              type: "sent",
              message: {
                type: "text",
                content: event.target.chatContent.value,
                timeStamp: new Date()
              } 
            }]
            let oneMessage = {
              type: "sent",
              message: {
                type: "text",
                content: event.target.chatContent.value},
                timeStamp: new Date()
            };
            var newResult = {
              ...targetChat,
              chatList: newChatList,
            }
            newChatState = newChatState.map(obj =>{
              if(obj.targetUser === `targetUserId ${toId}`)return newResult;
              else return obj;
            })

            // newChatState = chatState.map(obj =>{
            //   if(obj.targetUser === `targetUserId ${toId}`)return newResult;
            //   else return obj;
            // })
      
            //setChatState(newChatState);
            
          }
        }else{
          console.log("Send fail")
        }
      }).catch(ex=>{
        console.log(ex);
      }) 
    }
      console.log("newChatState: ", newChatState)
      setChatState(newChatState);
      return response;
  }
  
  

  return (
    <div className="App container mx-auto  mt-5 border border-gray-300 rounded-md p-10">
      <img className="mx-auto h-12 w-auto" src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg" alt="Workflow"></img>
      <h1 className="text-2xl text-center font-bold text-rose-700">Welcome to my chat-app</h1>
      {user.id===-1?
        <Login onLoginSuccess={onLoginSuccess}/> :
      <>
        <SockJsClient
          url={SOCKET_URL}
          topics={[`/topic/container-${user.id}`]}
          onConnect={onConnected}
          onDisconnect={onDisconnected}
          onMessage={msg => onMessageReceived(msg)}
          debug={false}
        />
        <div className="flex justify-end">
        <h3>Hello <span className="text-xl font-bold text-indigo-600">{user.userName} </span></h3>
        -
        <a href=''>Logout</a>
        </div>


        {/* Online user */}
        <div className="p-5 border border-gray-300 rounded-md">
          <h5 className="text-xl font-bold text-purple-700 border-b-2 mb-2 border-indigo-500">Online users</h5>
          <OnlineUsers listUsers = {onlineUsers} onClickHandler = {onClickHandler}></OnlineUsers>
        </div>

        

        {/* Chat box */}
          <ConnectWs listChatUsers={listChatUsers} 
                    chatState={chatState} 
                    handlerSend={handlerSend}
                    user = {user}
                    token ={token}
                    />
        {/* <div className="p-5 pb-0 border border-gray-300 rounded-md mt-3 min-h-full">
          <h5 className="text-xl font-bold text-purple-700 border-b-2 mb-2 border-indigo-500">Your conversations</h5>
          <p> <span className="font-bold">Caveat: </span>
            Because the messages will not be saved in real Database.
            <br/>
            <span className="pl-16"> So be careful!</span>
            <br/>
            <span className="pl-16"> If you reload page or close chat windows, the messages will be deleted!
            </span></p>
             <br/>
          <ChatBoxes 
                    listChatUsers={listChatUsers} 
                    chatState={chatState} 
                    handlerSend={handlerSend}
                    videoHandler={videoHandler}
                    voiceHandler={voiceHandler}
                    />
          
        </div> */}

        
      </>}
      
      
      
    </div>
  );
}

export default App;

const Login = ({onLoginSuccess})=>{
  const [err,setErr] = useState(false);
  const onSubmit = (event)=>{
    //success
    event.preventDefault();
    
    axios({
      method: "post",
      url: "http://localhost:8080/authenticate",
      data:{
        username: event.target.userName.value,
        password: event.target.passWord.value
      }
    }).then(response =>{
      setErr(false)
      sessionStorage.setItem("token",response.data.token);
      onLoginSuccess(response.data.responseUser);
    }).catch( err =>{
      console.error(err)
      setErr(true);
    })
  }
  return (
    <div>
      
      <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
          <img className="mx-auto h-12 w-auto" src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg" alt="Workflow" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
            </p>

            {err?<h5 className="text-center text-xl  text-gray-900 text-red-500">
              Username or Password is incorrect!</h5>:""}


          </div>
          
          <form className="mt-8 space-y-6" onSubmit={onSubmit} >
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="userName" className="sr-only">User Name</label>
                <input id="userName" name="userName"  required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address" />
              </div>
              <div>
                <label htmlFor="passWord" className="sr-only">Password</label>
                <input id="passWord" name="password" type="passWord" autoComplete="current-password" required className="mt-2 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </a>
              </div>
            </div>
            <div>
              <button type="submit" value="Sign in"className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  
                  <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}

const ConnectWs = ({listChatUsers,chatState,handlerSend,user,token}) =>{

  const pc = useRef(null);
  const dest = useRef(null);

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const btnStart = useRef(null);
  const btnHangup = useRef(null);
  const pendingUser = useRef(null);

  const [localStream,setLocalStream] = useState(null);
  const [remoteStream,setRemoteStream] = useState(null);
  //audio
  const [audio] = useState(new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"));

  const sock = new SockJs('http://localhost:8080/ws-chat');
  const stompClient = Stomp.over(sock);
  const header = {Authorization: `Bearer ${token}`};
  const [isFree,setIsFree] = useState(true);
  const [hangup,setHangup] = useState(false);
  const [pending,setPending] = useState(false);
  const [isAnswer,setIsAnswer] = useState(true);
  const [modalIsOpen,setModalIsOpen] = useState(false);
  const [mes,setMes] = useState(null);

  useEffect(()=>{
    stompClient.connect(header,frame =>{
      console.log("Connected and Frame: " + frame);
      var subscribeTopic = "/topic/user/" + user.id;
      stompClient.subscribe(subscribeTopic,handlerSomeMessge)
    })
    

  },[])
  const handlerSomeMessge = m =>{
    const message = JSON.parse(m.body);
    dest.current = message.fromId;
    console.log("message: " ,message);

    //setIsFree(false);
    setPending(false);

    if(!pc.current || pc.current ===null){
      createPeerConnection();
    }
    if(message.type === 'rtc'){
      if(message.data.sdp.type === 'answer'){
        pc.current.setRemoteDescription(new RTCSessionDescription(message.data.sdp))
          .then( ()=> {
            setIsFree(false)
            console.log("add remote thanh cong")
          })
          .catch(e => console.log("add remote that bai"));

      }
      else if(message.data.sdp.type === 'offer'){
        setHangup(true);
        setIsAnswer(false);
        setModalIsOpen(true);
        setMes(message)
        audio.play();
      }
    }
    else if(message.type === 'candidate'){
      pc.current.addIceCandidate(new RTCIceCandidate(message.data.candidate))
        .then(()=> console.log('candidate is added'))
        .catch(e => console.error("can not add ICE : ", e));
    }
    
  }

  const videoHandler = event =>{
    event.preventDefault();
    setIsFree(false);
    dest.current = event.target[0].value;
    navigator.getUserMedia = 
          navigator.getUserMedia 
          || navigator.webKitGetUserMedia 
          || navigator.moxGetUserMedia 
          || navigator.mozGetUserMedia 
          || navigator.msGetUserMedia
    if(navigator.getUserMedia){
      navigator.getUserMedia({
        audio: false, video: {
          mandatory: {
            maxWidth: 320,
            maxHeight: 240
          }
        }
      },stream =>{
        setLocalStream(stream);
        localVideo.current.srcObject = stream;
      }, err => console.error("Can not getUserMedia : " , err)
      )
    } else {
      navigator.mediaDevices.getUserMedia({
        audio: false, video: {
          mandatory: {
            maxWidth: 320,
            maxHeight: 240
          }
        }
      })
        .then( stream => {
          setLocalStream(stream);
          localVideo.current.srcObject = stream;
        } )
        .catch(err => console.error("cannot get usermedia: ", err))
    }

    pendingUser.current = listChatUsers.find(user => user.id == event.target[0].value)
    
    setPending(true);

    
  }
  const voiceHandler = event =>{
    event.preventDefault();
    dest.current = event.target[0].value;
    
    
  }
  const startHandler = () =>{
    setHangup(true);
    createPeerConnection();
    
    pc.current.addStream(localStream);
    doCall();
  }
  const hangupHandler = () =>{
    setHangup(false);
  }

  const createPeerConnection = () =>{
    var pc_config = {
      'iceServers': [{
         'urls': 'stun:foo.com:1234' 
      }]
    };
    try{
      pc.current = new RTCPeerConnection(pc_config);
      
      pc.current.onicecandidate = event =>{
        if(event.candidate){
          
          stompClient.send("/app/request",{},JSON.stringify({
            type: "candidate",
            fromId: user.id,
            destId: dest.current,
            data:{
              'candidate' : event.candidate,
            }
          }));
          
        };
      }
    }catch(e){
      console.error("co loi" , e);

      logErr(e);
      return;
    }
    //onaddstream
    pc.current.onaddstream = event => {
      remoteVideo.current.srcObject = event.stream;
      setRemoteStream(event.stream);
    };
  }
  const doCall = () => {
    pc.current.createOffer(localDescCreated,logErr);
  }

  const localDescCreated = desc =>{
    pc.current.setLocalDescription(desc)
    .then( ()=>{
      sendMessage({
        type: "rtc",
        fromId: user.id,
        destId: dest.current,
        data: {
          'sdp': pc.current.localDescription,
        }
      })
    })
    .catch( e => logErr(e));
  }

  const sendMessage = message =>{
    stompClient.send("/app/request",{},JSON.stringify(message));
  }

  const logErr = e => console.error("error: ",e);

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
    },
  };

  const acceptHandler = () =>{
    audio.pause();
    setModalIsOpen(false);
    setIsFree(false);
    setPending(false)

    pc.current.setRemoteDescription(new RTCSessionDescription(mes.data.sdp))
          .then(()=>{
            navigator.mediaDevices.getUserMedia({audio: false, video:{
              mandatory: {
                maxWidth: 320,
                maxHeight: 240
              }
            }}).then( stream =>{
              localVideo.current.srcObject = stream;
              setLocalStream(stream);
              return pc.current.addStream(stream);
            }).then(()=> {
              return pc.current.createAnswer();
            }).then(desc =>{
              dest.current = mes.fromId;
              return pc.current.setLocalDescription(desc);
            })
            .then(()=>{
              sendMessage({
                type: "rtc",
                fromId: user.id,
                destId: mes.fromId,
                data:{
                  'sdp' : pc.current.localDescription,
                }
              })
            })
            .catch(e => console.error("cannot creat answer",e));
          })
          

       

  }

  const denyHandler = () =>{
    setModalIsOpen(false);
    audio.pause();
  }

  return (
    <div className="p-5 pb-0 border border-gray-300 rounded-md mt-3 min-h-full">
      <h5 className="text-xl font-bold text-purple-700 border-b-2 mb-2 border-indigo-500">Your conversations</h5>
      {isAnswer? null:
          <div>
          <Modal
            isOpen={modalIsOpen}
            style={customStyles}
            contentLabel="Example Modal"
          >

            <div>you have a calling from someone...?</div>
            <button onClick={acceptHandler} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Accept</button>
            <button onClick={denyHandler} className="py-2.5 px-5 mr-2 mb-2 text-sm font-medium text-gray-900 bg-white rounded-full border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Deny</button>
          </Modal>
            
          </div>}
      {isFree? "":
        <div className="grid grid-cols-2 overflow-hidden">
          <video className="inline-block rounded-lg m-auto" ref={localVideo} autoPlay playsInline />
          {pending?
            <div className="inline-block w-full relative">
              <img className="h-full" alt="img" src = "https://4kwallpapers.com/images/walls/thumbs_3t/5584.jpg" />
              <img className="absolute top-6 w-1/2 max-h-72 rounded-full left-1/4 " alt = 'img' src= {pendingUser.current.avatarUrl} />
            </div>
            :
            <video className="inline-block rounded-lg m-auto" ref={remoteVideo} autoPlay playsInline />
          }
          
          
          
          {!hangup?
            <button onClick = {startHandler} className="m-auto w-32 mt-2 relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800">
            <span class="w-full relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
              Start Calling
            </span>
          </button>
            :
            <button onClick = {hangupHandler} className="m-auto w-32 mt-2 relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:ring-pink-200 dark:focus:ring-pink-800">
            <span className="w-full relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
              Hang Up
            </span>
          </button>
          }
          
          
          
        </div>
      }
      <p> <span className="font-bold">Caveat: </span>
        Because the messages will not be saved in real Database.
        <br />
        <span className="pl-16"> So be careful!</span>
        <br />
        <span className="pl-16"> If you reload page or close chat windows, the messages will be deleted!
        </span>
        <br />
        <span className="font-bold">Admin: </span><span className="font-bold text-purple-700"> Kein Pham </span>
        </p>
      <br />
      <ChatBoxes
        listChatUsers={listChatUsers}
        chatState={chatState}
        handlerSend={handlerSend}
        videoHandler={videoHandler}
        voiceHandler={voiceHandler}
      />

    </div>
  );
}

const OnlineUsers = ({listUsers,onClickHandler}) =>{
  // listUsers.filter(item => item.id !=)
  return (
    <div className="grid grid-cols-4 content-start">
      {listUsers.map((user) => <OneUser key={user.id} user = {user} onClickHandler={onClickHandler} />)}
    </div>
  )
}

const OneUser = ({user,onClickHandler}) =>{
  // let onClickHandler = (user) =>{
  //   onClickHandler(user);
  // }

    return (
        <div style={{cursor: 'pointer'}} onClick={()=>onClickHandler(user)} 
        className="w-3/4 h-12 mb-2 ml-5 rounded-md 
        bg-gradient-to-r from-purple-500 to-pink-500
        flex justify-start  text-white overflow-hidden
        ">
          <div className="h-full w-1/4  rounded-full">
            <img className="w-5/6 rounded-full" src={user.avatarUrl} alt="avatar"/>
          </div>
          <div className="h-full w-2/3 grid grid-cols-1 content-center ">
            <span className=" font-bold text-white">{user.userName}</span>
          </div>

        </div>
      
      
    )
}




const ChatBoxes = ({listChatUsers,chatState,handlerSend,videoHandler,voiceHandler}) =>{
  return (
    <div className="h-96 flex justify-end">
      {listChatUsers.map( chatUser => 
      <BoxChat key={chatUser.id} 
              user = {chatUser} 
              chatState={chatState} 
              handlerSend={handlerSend}
              videoHandler={videoHandler}
              voiceHandler={voiceHandler}
              />)}
    </div>
  )
}
const BoxChat = ({user,chatState,handlerSend,videoHandler,voiceHandler}) =>{
  var chatList = null;
  var chatObj = null;
  chatState.forEach(obj =>{
    if(obj.targetUser == `targetUserId ${user.id}` )
    chatObj = {...obj};
  })
  if(chatObj != null)
    chatList= chatObj.chatList;

  const [value,setValue] = useState("");
  const [src,setSrc] = useState("");
  const [file,setFile] = useState(null);
  
  const imageInputRef = useRef();
  // console.log(chatContents)
  const onSend=(event)=>{
    event.preventDefault();
    
    new Promise(resolve =>{
      return  resolve(handlerSend(event,user.id,file));
    }).then(response => {
      
      setValue("");
      setSrc("");
       setFile(null);
      
    })
    
  }
  const onChange = event => setValue(event.target.value);
  const handlerFileInput = event => {
    var file = event.target.files[0];
    setFile(file);
    var reader = new FileReader();
    reader.onload = function (e) {
      setSrc(e.target.result);
    };
    
    reader.readAsDataURL(file);

  }
  

  
  return (
    <div className="w-72 border border-gray-300 min-h-full rounded-md grid grid-cols-1 content-end p-1 relative">

      <div className="w-full h-5 rounded-t-md bg-slate-400 flex justify-start items-center space-x-1.5 px-1.5 -top-1 right-0 absolute">
        <span className="w-3 h-3 rounded-full bg-red-400 cursor-pointer"></span>
        <span className="w-3 h-3 rounded-full bg-yellow-400 cursor-pointer"></span>
        <span className="w-3 h-3 rounded-full bg-green-400 cursor-pointer"></span>

        

        
      </div>

      {/* name box */}
      <div className="absolute top-3 w-full pt-1">
      {user.isFocused ?
        <div className="w-full h-12 mb-2 rounded-b-md bg-gray-300 p-1 flex justify-start">
          <div className="h-full w-1/6 rounded-full overflow-hidden">
            <img className="w-10 h-10 rounded-full" src={user.avatarUrl} alt="avatar" />
          </div>
          <div className="h-full w-2/3 grid grid-cols-1 content-center pl-3">
            <span className=" font-bold text-white">{user.userName}</span>
            </div>

            <div className="w-16 grid grid-cols-2">
              <form onSubmit={videoHandler}>
                <input type="hidden" value={user.id} />
                <button type="submit" >
                  <div className="cursor-pointer">
                    <img className='w-5' src="https://img.icons8.com/material-rounded/24/000000/video-call.png" alt="img" />
                  </div>
                </button>
              </form>
              <form onSubmit={voiceHandler}>
                <input type="hidden" value={user.id} />
                <button type="submit" >
                  <div className="cursor-pointer">
                    <img className='w-5' src="https://img.icons8.com/ios-glyphs/30/000000/outgoing-call.png" alt="img" />
                  </div>
                </button>
              </form>


            </div>

          </div>
      :
      <div className="w-full h-12 mb-2 rounded-b-md bg-slate-200 p-1 flex justify-start">
        <div className="h-full w-1/6  rounded-full overflow-hidden">
          <img className="w-10 h-10 rounded-full" src={user.avatarUrl} alt="avatar"/>
        </div>
        <div className="h-full w-2/3 grid grid-cols-1 content-center pl-3">
          <span className=" font-bold">{user.userName}</span>
        </div>
            <div className="w-16 grid grid-cols-2">
              <form onSubmit={videoHandler}>
                <input type="hidden" value={user.id} />
                <button type="submit" >
                  <div className="cursor-pointer">
                    <img className='w-5' src="https://img.icons8.com/material-rounded/24/000000/video-call.png" alt="img" />
                  </div>
                </button>
              </form>
              <form onSubmit={voiceHandler}>
                <input type="hidden" value={user.id} />
                <button type="submit" >
                  <div className="cursor-pointer">
                    <img className='w-5' src="https://img.icons8.com/ios-glyphs/30/000000/outgoing-call.png" alt="img" />
                  </div>
                </button>
              </form>


            </div>
      </div>
      
      }
      </div>
      
      

      {/* content box */}
      <div className="w-full h-64 mr-3 mb-2  flex flex-col-reverse overflow-auto">
        {chatList != null ?
        <Messages avt={user.avatarUrl} messages={chatList}/>
        :
        ""
        }
          
      </div>
        

      {src !== "" ?
                  <div>
                    <img className="h-12" src={src} alt="img" />
                  </div>
                  :
                  <div>
                  </div>
                }
      {/* send box */}
      <div className="w-72 h-12 flex justify-start relative">
        <form onSubmit={onSend}>
          
          
          <div style={{ display: 'inline-block'}} className="h-9 pt-1.5 cursor-pointer absolute top-2.5">
            <label className="pt-10 cursor-pointer" htmlFor={"input-file-"+ user.id}>
              <img alt="img" className="w-6 h-6"
                src="https://www.svgrepo.com/show/49851/jpg-file.svg" />
            </label>

            <input style={{ display: 'none' }} onChange={handlerFileInput} id={"input-file-"+ user.id} type="file" ref={imageInputRef} />
          </div>
          <div style={{ display: 'inline-block' }} className="absolute bottom-1 left-7 break-all ">
            <input onChange={onChange} value={value} autoComplete="off" id="chatContent"
              type="text" className="w-52 mr-2 bg-slate-100 h-8 rounded-full pl-3" />
          </div>
         
          <div className="max-w-xs break-all">
            <button type="submit" className="py-2 px-3 text-xs font-medium text-center 
            text-blue-700 border border-blue-700  rounded-full hover:bg-blue-800 hover:text-white  focus:ring-4 focus:ring-blue-300 
            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
             absolute right-2 top-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>

            </button>
          </div>
        
        </form>
      </div>

    </div>
  )
}

const Messages = ({ avt,messages}) => {

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  

  useEffect(() => {
    scrollToBottom()
  }, [messages]);
  const checkBefore = (index)=>{
    var check =false;
    
    if(index>0){
      if(messages[index-1].type== "received") check = true;
    }
    return check;
  }
  const checkSendId = index =>{
    var check =false;
    
    if(index>0){
      if(messages[index-1].type== "sent") check = true;
    }
    return check;
  }
  return (
    <div >
      
      {messages.map((item,i) => {
            
            return (
              <div key={uuidv4()} className="">
                
                <div>
                  {item.type == "received" ?
                    <div className="mt-1 flex justify-start">
                      {!checkBefore(i)? 
                        <div >
                          <img className="w-5 h-5 rounded-full" src={avt} alt="avt" />
                        </div>
                      : 
                        <div></div>}
                      
                      {!checkBefore(i)?
                      
                        <div style={{ width: '200px' }} className="break-all flex justify-start" >
                          {item.message.type === "multipart"?
                            <img className="w-3/4" src={item.message.content} alt="img" />:
                            <p className="ml-1 bg-slate-200 
                                    font-medium rounded-lg text-sm px-2 py-1 text-left
                                    items-center
                                    break-words">
                            {item.message.content}
                          </p>
                          }
                          
                          <div style={{ width: '50px' }} className="text-gray-500 ml-1 text-xs font-medium text-center">
                            {item.message.timeStamp.getHours() + ":" + item.message.timeStamp.getMinutes()}
                          </div>
                        </div>
                      :
                        <div style={{ width: '200px' }} className="break-all flex justify-start" >

                          {item.message.type === "multipart"?
                            <img className="w-3/4" src={item.message.content} alt="img" />:
                            <p className="ml-6 bg-slate-100
                                          font-medium rounded-lg text-sm px-2 py-1 text-left
                                          items-center
                                          break-words"> 
                            {item.message.content}
                            </p>
                            }

                        </div>
                      
                      }
                      
                    </div>
                    :
                    <div className="mt-1 flex justify-end">
                      
                      <div style={{width: '240px'}} className="break-all flex justify-end" >
                        {!checkSendId(i) ?
                          <div style={{ width: '50px' }} className="text-gray-500 mr-1 text-xs font-medium text-center">
                            {item.message.timeStamp.getHours() + ":" + item.message.timeStamp.getMinutes()}
                          </div>
                          :
                          <div></div>

                        }
                        {item.message.type === "multipart"?
                          <img className="w-2/4" src={item.message.content} alt="img"/>
                          :
                          <p className="text-white bg-gradient-to-br from-purple-600 to-blue-500 
                                      font-medium rounded-lg text-sm px-2 py-1 text-left
                                      items-center
                                      break-words">
                          {item.message.content}
                          </p>

                        }
                        
                      </div>
                       
                    </div>
                  }
                </div>

              

              </div>
              

              
            )
          })}
      <div ref={messagesEndRef} />
    </div>
  )
}


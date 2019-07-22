import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { randomString } from '../utils';
// @ts-ignore
import { connection as AyameConnection } from '@open-ayame/ayame-web-sdk';

export interface P2PSimpleProps {
  onStartRemoteStream: (stream: MediaStream) => void;
  setLocalStream: (stream: MediaStream) => void;
  onCloseRemoteStream: () => void;
  wsUrl: string;
  roomId: string;
  clientId: string;
}

export interface P2PSimpleState {
  conn: any;
}

const initialState: P2PSimpleState = {
  conn: null
};

const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
const peerConnectionConfig = {
  iceServers,
};

class P2PNegotiator extends React.Component<P2PSimpleProps, P2PSimpleState> {
  public state = initialState;

  constructor(props: P2PSimpleProps) {
    super(props);
  }

  public render() {
    return (
      <div>
        <Buttons>
          <Button onClick={this.connect.bind(this)} type='button'>接続</Button>
          <Button onClick={this.disconnect.bind(this)} type='button' >切断</Button>
        </Buttons>
      </div>
    );
  }

  public async connect() {
    const conn = AyameConnection(this.props.wsUrl, this.props.roomId);
    conn.on('disconnect', (_e: any) => {
      this.props.onCloseRemoteStream();
    });
    conn.on('addstream', async (e: any) => {
      this.props.onStartRemoteStream(e.stream);
    });

    const localStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true})
    const stream = await conn.connect(localStream);
    this.props.setLocalStream(stream);
    this.setState({ conn: conn });
  }

  public disconnect() {
    if (this.state.conn) {
      this.state.conn.disconnect();
    }
  }
}

export default function P2PSimple() {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string>(randomString(9));
  const clientId = randomString(17);
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:3000/ws');
  const onChangeWsUrl = (e: React.ChangeEvent<HTMLInputElement>) => setWsUrl(e.target.value);
  const onChangeRoomId = (e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value);
  const onCloseRemoteStream = useCallback(() => setRemoteStream(null), []);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);


  useLayoutEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useLayoutEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <Main>
      <Title>
        <h2>Ayame React Sample</h2>
      </Title>
      <Inputs>
        <Input>
          <label htmlFor='url'>シグナリングサーバのURL:</label>
          <input
            className='input'
            type='text'
            id='url'
            onChange={onChangeWsUrl}
            value={wsUrl}
            />
        </Input>
        <Input>
          <label htmlFor='roomId'>部屋のID:</label>
          <input
            className='input'
            type='text'
            id='roomId'
            onChange={onChangeRoomId}
            value={roomId}
          />
        </Input>
      </Inputs>
      <P2PNegotiator
        wsUrl={wsUrl}
        roomId={roomId}
        clientId={clientId}
        setLocalStream={setLocalStream}
        onStartRemoteStream={setRemoteStream}
        onCloseRemoteStream={onCloseRemoteStream}
      />
      <Videos>
        <RemoteVideo ref={remoteVideoRef} autoPlay />
        <LocalVideo ref={localVideoRef} autoPlay muted />
      </Videos>
    </Main>
  );
}

const Main = styled.div`
  text-align: center;
`;
const Title = styled.div`
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  top: 40px;
`;
const Inputs = styled.div`
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  top: 80px;
`;
const Input = styled.div`
  display: inline-block;
`;

const Button = styled.button`
  background-color: #4285f4;
  border: none;
  border-radius: 2px;
  box-shadow: 1px 1px 5px 0 rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.8em;
  height: 2.75em;
  margin: 0 5px 20px 5px;
  padding: 0.5em 0.7em 0.5em 0.7em;
  width: 8em;
`;
const Buttons = styled.div`
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  top: 140px;
`;
const Videos = styled.div`
  font-size: 0;
  pointer-events: none;
  position: absolute;
  transition: all 1s;
  width: 100%;
  height: 100%;
  display: block;
`;

const RemoteVideo = styled.video`
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  object-fit: cover;
  transform: scale(-1, 1);
  transition: opacity 1s;
  width: 100%;
`;
const LocalVideo = styled.video`
  z-index: 2;
  border: 1px solid gray;
  bottom: 20px;
  right: 20px;
  max-height: 17%;
  max-width: 17%;
  position: absolute;
  transition: opacity 1s;
`;


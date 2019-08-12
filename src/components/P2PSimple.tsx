import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { randomString } from '../utils';
// @ts-ignore
import { connection as AyameConnection, defaultOptions } from '@open-ayame/ayame-web-sdk';

export interface P2PSimpleProps {
  onStartRemoteStream: (stream: MediaStream) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  onCloseRemoteStream: () => void;
  wsUrl: string;
  roomId: string;
  clientId: string;
  signalingKey: string;
  isRecvOnly: boolean;
  videoCodec: string;
}

export interface P2PSimpleState {
  conn: any;
}

const initialState: P2PSimpleState = {
  conn: null
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
    let options: any = defaultOptions;
    if (this.props.isRecvOnly) {
      options.audio.direction = 'recvonly';
      options.video.direction = 'recvonly';
    }
    if (['H264', 'VP8', 'VP9'].includes(this.props.videoCodec)) {
      options.video.codec = this.props.videoCodec;
    }
    const conn = AyameConnection(this.props.wsUrl, this.props.roomId, options);
    conn.on('disconnect', (_e: any) => {
      this.props.onCloseRemoteStream();
    });
    conn.on('addstream', async (e: any) => {
      this.props.onStartRemoteStream(e.stream);
    });
    conn.on('open', (_e: any) => {
      this.setState({ conn: conn });
    });
    let localStream: MediaStream | null = null;
    if (!this.props.isRecvOnly) {
      localStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true})
    }
    if (this.props.signalingKey.length > 0) {
      await conn.connect(localStream, { key: this.props.signalingKey});
    } else {
      await conn.connect(localStream);
    }
    this.props.setLocalStream(localStream);
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
  const [signalingKey, setSignalingKey] = useState<string>('');
  const [isRecvOnly, setIsRecvOnly] = useState<boolean>(false);
  const [videoCodec, setVideoCodec] = useState<string>("");
  const clientId = randomString(17);
  const [wsUrl, setWsUrl] = useState<string>('wss://ayame-lite.shiguredo.jp/signaling');
  const onChangeWsUrl = (e: React.ChangeEvent<HTMLInputElement>) => setWsUrl(e.target.value);
  const onChangeRoomId = (e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value);
  const onChangeVideoCodec = (e: React.ChangeEvent<HTMLSelectElement>) => setVideoCodec(e.target.value);
  const onChangeSignalingKey = (e: React.ChangeEvent<HTMLInputElement>) => setSignalingKey(e.target.value);
  const onCloseRemoteStream = useCallback(() => setRemoteStream(null), []);
  const onChangeIsRecvOnly = (e: React.ChangeEvent<HTMLInputElement>) => setIsRecvOnly(e.target.checked);
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
      <Input>
        <label htmlFor='signalingKey'>シグナリングキー(オプション):</label>
        <input
          className='input'
          type='text'
          id='signalingKey'
          onChange={onChangeSignalingKey}
          value={signalingKey}
        />
      </Input>
      <Input>
        <label htmlFor='videoCodec'>コーデック</label>
        <select id="videoCodec" className="input" onChange={onChangeVideoCodec}>
          <option value="">指定なし</option>
          <option value="H264">H264</option>
          <option value="VP8">VP8</option>
          <option value="VP9">VP9</option>
        </select>
      </Input>
      <Input>
        <input
          className='input'
          type='checkbox'
          id='isRecvOnly'
          onChange={onChangeIsRecvOnly}
          checked={isRecvOnly}
        />
        <label htmlFor='isRecvOnly'>受信のみにする</label>
      </Input>
    </Inputs>
      <P2PNegotiator
        wsUrl={wsUrl}
        roomId={roomId}
        clientId={clientId}
        signalingKey={signalingKey}
        setLocalStream={setLocalStream}
        onStartRemoteStream={setRemoteStream}
        onCloseRemoteStream={onCloseRemoteStream}
        videoCodec={videoCodec}
        isRecvOnly={isRecvOnly}
      />
      <Videos>
        <RemoteVideo ref={remoteVideoRef} autoPlay/>
        {!isRecvOnly && (<LocalVideo ref={localVideoRef} autoPlay muted />)}
      </Videos>
    </Main>
  );
}

const Main = styled.div`
  text-align: center;
`;
const Title = styled.div`
  top: 40px;
`;
const Inputs = styled.div`
  top: 80px;
`;
const Input = styled.div`
  display: inline-block;
  margin: auto 10px;
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
  margin: 10px;
`;
const Videos = styled.div`
  font-size: 0;
  pointer-events: none;
  position: absolute;
  transition: all 1s;
  width: 100%;
  height: 80%;
  display: block;
`;

const RemoteVideo = styled.video`
  height: 70%;
  max-height: 70%;
  max-width: 100%;
  object-fit: contain;
  transition: opacity 1s;
  width: 100%;
`;
const LocalVideo = styled.video`
  z-index: 2;
  border: 1px solid gray;
  bottom: 0px;
  right: 20px;
  max-height: 30%;
  max-width: 30%;
  position: absolute;
  transition: opacity 1s;
`;


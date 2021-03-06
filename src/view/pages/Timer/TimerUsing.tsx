import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { memo, useEffect, useState } from "react";
import { useTimer } from "use-timer";
import { zeroPadding } from "../../../utils";
import DoDisturbIcon from '@mui/icons-material/DoDisturb';
import { useAuthContext } from "../../../functional/firebase/auth/AuthProvider";
import { useDBContext } from "../../../functional/firebase/db/DBProvider";

/**
 * Timer本体
 * props
 * - initialTime: 何秒からカウントするか。
 * - onEnd: 一連の処理が終わった後に実行するコールバック関数。
 */
const TimerUsing = memo((props: {
  initialTime: number,
  onEnd: () => void,
}) => {
  const { email, scheduleId } = useAuthContext()
  const { appointData, updateAppointData } = useDBContext();
  const {
    time, start, pause, reset, status, advanceTime
  } = useTimer({
    autostart: true,
    initialTime: props.initialTime,
    interval: 1000,
    endTime: 0,
    timerType: 'DECREMENTAL',
    onTimeOver: () => {
      setEndTime(new Date());
      alert("終了しました。");
      dataInputDialogHandleOpen();
    },
  });

  // スタートした時間
  const [ startTime, setStartTime ] = useState<Date>(new Date());

  // 終了した時間
  const [ endTime, setEndTime ] = useState<Date | null>(null);

  // スケジュールのタイトル
  const [ title, setTitle] = useState("無題");

  // スケジュールのメモ
  const [ memo, setMemo ] = useState("");

  // 秒数
  const [ second, setSecound ] = useState(0);

  // 分数
  const [ minute, setMinute ] = useState(0);

  // 時間
  const [ hour, setHour ] = useState(0);

  /**
   * timeが更新されたら、表示する時間を更新
   */
  useEffect(() => {
    setSecound(time % 60);
    setMinute((time / 60 | 0) % 60);
    setHour(time / 3600 | 0);
  }, [time]);

  /**
   * タイマーを止めるときに、本当に止めてよいかチェックする。
   */
  const [openCheckDialog, setOpenCheckDialog] = useState(false);
  const checkDialogHandleOpen = () => {
    setOpenCheckDialog(true);
  }
  const checkDialogHandleClose = () => {
    setOpenCheckDialog(false);
  }
  const checkDialogDisagree = () => {
    checkDialogHandleClose();
  }
  const checkDialogAgree = () => {
    setEndTime(new Date());
    pause();
    checkDialogHandleClose();
    dataInputDialogHandleOpen();
  }

  /**
   * スケジュールのタイトルとメモを入力させ、firestoreに今回の記録を反映。
   */
  const [openDataInputDialog, setOpenDataInputDialog] = useState(false);
  const dataInputDialogHandleOpen = () => {
    setOpenDataInputDialog(true);
  }
  const dataInputDialogHandleClose = () => {
    setOpenDataInputDialog(false);
  }
  const dataInputDialogDisagree = () => {
    dataInputDialogHandleClose();
    props.onEnd();
  }
  const dataInputDialogAgree = async () => {
    if (appointData) {
      let data = Object.create(appointData);
      const serialNum = data.length > 0 ? data[data.length - 1].serialNum + 1 : 0;
      const addedId = scheduleId + String(serialNum);
      data = [...data, { id: addedId, userName: email, serialNum: serialNum, title: title, startDate: startTime, endDate: endTime, notes: memo }];
      await updateAppointData(scheduleId, data);
    }
    dataInputDialogHandleClose();
    props.onEnd();
  }

  /**
   * タイマーをスタート
   */
  const stopTimer = () => {
    checkDialogHandleOpen();
  }

  return (
    <div>
      <div style={{ fontSize: "100px" }}>
        <span>{zeroPadding(hour, 2)}</span>:<span>{zeroPadding(minute, 2)}</span>:<span>{zeroPadding(second, 2)}</span>
      </div>
      <Button 
          onClick={stopTimer} 
          variant="contained" 
          startIcon={<DoDisturbIcon />}
        >
          Stop
      </Button>
      <Dialog
        open={openCheckDialog}
        onClose={checkDialogHandleClose}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          {"本当に終わりますか？"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={checkDialogDisagree} autoFocus>Disagree</Button>
          <Button onClick={checkDialogAgree} >Agree</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDataInputDialog}
        onClose={dataInputDialogHandleClose}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          {"データを入力してください。"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="title"
            type="text"
            fullWidth
            variant="standard"
            onChange={(event) => setTitle(event.target.value)}
          />
          <TextField
            margin="dense"
            id="memo"
            label="memo"
            type="text"
            fullWidth
            variant="standard"
            onChange={(event) => setMemo(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={dataInputDialogDisagree} autoFocus>破棄する</Button>
          <Button onClick={dataInputDialogAgree} >OK!</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default TimerUsing;
 
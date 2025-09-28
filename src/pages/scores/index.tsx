// import { Input } from "./ui/input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { toast, Toaster } from "sonner"
import type { ObjectEntry, ScoreEntry, UserEntry } from '@/types';
import { SubmitScores } from "@/lib/api";
import roundup from '@/assets/roundup.png'

const WS_MESSAGES = {
  CONNECT: '"{\\"msg\\":\\"connect\\",\\"version\\":\\"1\\",\\"support\\":[\\"1\\",\\"pre2\\",\\"pre1\\"]}"',
  PONG: '"{\\"msg\\":\\"pong\\"}"',
  CARD_SUB: (messageId: string, cardId: string) => 
    `"{\\"msg\\":\\"sub\\",\\"id\\":\\"${messageId}\\",\\"name\\":\\"scorecardForId\\",\\"params\\":[\\"${cardId}\\"]}"`,
  PLAYER_SUB: (messageId: string, objectIds: string[]) => 
    `"{\\"msg\\":\\"sub\\",\\"id\\":\\"${messageId}\\",\\"name\\":\\"cardcastEntries\\",\\"params\\":[[${objectIds.map(id => `\\"${id}\\"`).join(",")}]]}"`,
  USER_SUB: (userIds: string[]) =>
    `"{\\"msg\\":\\"method\\",\\"id\\":\\"2\\",\\"method\\":\\"users.getCardCastUsersAndPlayers\\",\\"params\\":[{\\"userIds\\":[${userIds.map(id => `\\"${id}\\"`).join(",")}],\\"playerIds\\":[]}]}"`
};

const generateWebSocketId = (full_id = false) => {
  const firstPart = Math.floor(Math.random() * 900 + 100);
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  let secondPart = '';
  for (let i = 0; i < 8; i++) {
    secondPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return full_id ? `${firstPart}/${secondPart}` : secondPart;
};

const ScoreSubmission = async (scores: Array<ScoreEntry>) => {
  try {
    for (const score of scores) {
      console.log("Submitting score:", score);
      const response = await SubmitScores(score);
      console.log("Score submission response:", response);
    }
  } catch (error) {
    console.error("Error submitting scores:", error);
  }
};

const Score = () => {
  const [url, setUrl] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [scores, setScores] = useState<Array<ScoreEntry> | null>(null);
  const [users, setUsers] = useState<Array<UserEntry> | null>(null);
  const usersRef = useRef<Array<UserEntry> | null>(null);

  const [pendingPlayerMessage, setPendingPlayerMessage] = useState<{
    messageId: string;
    objectIds: string[];
  } | null>(null);

  useEffect(() => {
    if(scores?.length === usersRef.current?.length && ws) {
      console.log("All scores received");
      console.log("Final scores:", scores);
      // Make a request to back end to store scores

      toast("Card has been uploaded successfully! You can safely leave this page. ", {
          description: new Date().toLocaleTimeString(),
          duration: 20000,
          closeButton: true,
      })

      const response = ScoreSubmission(scores!);
      console.log("Score submission response:", response);
    }
  }, [scores]);

  useEffect(() => {
    usersRef.current = users;
    if (
      users &&
      pendingPlayerMessage?.messageId &&
      pendingPlayerMessage?.objectIds
    ) {
      console.log("Sending player subscription message");
      ws?.send(
        WS_MESSAGES.PLAYER_SUB(
          pendingPlayerMessage.messageId,
          pendingPlayerMessage.objectIds
        )
      );
    } else {
      console.log("Pending player message or users not ready yet");
    }
  }, [users]);

  const resetVariables = () => {
    setScores(null);
    setUsers(null);
    usersRef.current = null;
    setPendingPlayerMessage(null);
  }

  const handleSubmit = (url: string) => {
    const card_id = url.split("/").pop()?.split("?")[0];
    let sent_connection_message: boolean = false;
    let sent_card_message: boolean = false;
    const sent_player_scorecards_message: boolean = false;
    let sent_user_scorecards_message: boolean = false;
    let card_object_id: string[], user_object_id: string[];
    resetVariables();

    // Check if the card was already submitted today if so show a toast message and return

    if(!ws) {
      const ws_id = generateWebSocketId(true);
      const new_ws = new WebSocket(`wss://sync.udisc.com/sockjs/${ws_id}/websocket`);
      new_ws.onopen = () => {
        console.log('Connected to WebSocket');
        setWs(new_ws);
      };

       new_ws.onclose = () => {
        console.log('Disconnected from WebSocket');
        setWs(null);
      };

      new_ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWs(null);
      };

      new_ws.onmessage = (event) => {
        if (event.data === "o") {
          new_ws.send(WS_MESSAGES.CONNECT);
          sent_connection_message = true;
        } else if (event.data.startsWith('a[')) {
          try {
            const inner_message = event.data.slice(2, -1);
            const parsed_inner_message = JSON.parse(JSON.parse(inner_message));
            console.log('Parsed server message:', parsed_inner_message);
            
            if (sent_connection_message && !sent_card_message) {
              const card_message_id = generateWebSocketId();
              console.log('Sending card subscription message:');
              new_ws.send(WS_MESSAGES.CARD_SUB(card_message_id, card_id!));
              sent_card_message = true;
            }

            if(parsed_inner_message.msg === "result") {
              const users_array = parsed_inner_message.result.users;
              console.log('User fields:', users_array);
              setUsers(prevUsers => {
                const existingUsers = prevUsers || [];
                const newUsers = users_array.map((user_fields: UserEntry) => ({
                  _id: user_fields._id,
                  full_name: user_fields.full_name,
                  name: user_fields.name,
                  username: user_fields.username
                }));

                console.log("New users to add:", newUsers);
                const mergedUsers = [...existingUsers];

                newUsers.forEach((newUser: UserEntry) => {
                  const userExists = mergedUsers.some(user => user._id === newUser._id);
                  if (!userExists) {
                    mergedUsers.push(newUser);
                  }
                });
                
                return mergedUsers;
              });
            }

            if(parsed_inner_message.collection && parsed_inner_message.collection == "Scorecard" && sent_card_message) {
              const fields = parsed_inner_message.fields;
              card_object_id = fields.entries.map( (entry: ObjectEntry) => entry.objectId );
              console.log('Scorecard entries:', card_object_id);

              user_object_id = fields.users.map( (player: ObjectEntry) => player.objectId );
              console.log('User object IDs:', user_object_id);
            
              if(!sent_player_scorecards_message) {
                const player_message_id = generateWebSocketId();
                setPendingPlayerMessage({ messageId: player_message_id, objectIds: card_object_id });
              }

              if(!sent_user_scorecards_message) {
                new_ws.send(WS_MESSAGES.USER_SUB(user_object_id));
                sent_user_scorecards_message = true;
              }
            }

            if(parsed_inner_message.collection && parsed_inner_message.collection == "ScorecardEntry" && sent_card_message) {
              const new_score_card: ScoreEntry = {
                card_id: parsed_inner_message.id,
                start_date: parsed_inner_message.fields.startDate['$date'],
                end_date: parsed_inner_message.fields.endDate['$date'],
                layout_id: parsed_inner_message.fields.layoutId,
                round_rating: parsed_inner_message.fields.roundRating,
                hole_scores: parsed_inner_message.fields.holeScores,
                user: usersRef.current?.find(user => user._id === parsed_inner_message.fields.users[0]?.objectId) || null
              }
              console.log("New score card to add:", new_score_card);
              setScores(prevScores => {
                const existingScores = prevScores || [];
                const scoreExists = existingScores.some(score => score.card_id === new_score_card.card_id);
                if (!scoreExists) {
                  return [...existingScores, new_score_card];
                }
                return existingScores;
              })
            }

          } catch (e) {
            console.error('Error parsing message:', e);
          }
        }
        else if (event.data && event.data.msg === "ping"){
          console.log("Received ping, sending pong");
          const pongMessage = '"{\\"msg\\":\\"pong\\"}"';
          new_ws.send(pongMessage);
        }
      }

    }
  };

  const buttonText = ws?.readyState === WebSocket.OPEN ? "Connected" : "Connect";

return (
  <div className="flex flex-col space-y-4">
            <img
          width="150px"
          height="auto"
          src={roundup}
          alt="Round Up Logo"
          className="logo"
        />
    <div className="flex gap-2 items-center">
      <Input type="text" placeholder="Enter your Cardcast URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <Button disabled={ws ? true : false} onClick={() => handleSubmit(url)}> {buttonText} </Button>
    </div>
    <Toaster position="top-center" />
    {scores && scores.length > 0 && (
      <div className="w-full">
        <h3 className="text-lg font-bold mb-4">Round Scores</h3>
        <div className="max-h-[500px] overflow-y-auto space-y-3">
          {scores.map((score) => (
            <div key={score.card_id} className="bg-white shadow-sm border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-2">
                {/* Header with player name and date */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div className="font-semibold text-gray-900">
                    {score.user?.full_name || score.user?.name || 'Unknown Player'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(score.start_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                {/* Stats row */}
                <div className="flex justify-between items-center pt-1">
                  <div></div> {/* Empty div for spacing */}
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500"> Round Rating </span>
                      <span className="font-bold text-blue-600">{Number(score.round_rating).toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500"> Strokes </span>
                      <span className="font-bold text-gray-900">
                        {score.hole_scores.reduce((total, hole) => total + hole.strokes + (hole.penalty || 0), 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <IoCheckmarkCircleOutline size={25} color="green" />
                  </div>
                  {/* You could add more stats here if needed */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)};

export default Score;

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Player {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  current_streak: number;
  is_ready: boolean;
  is_connected: boolean;
  last_answer_correct: boolean | null;
}

interface GameRoom {
  id: string;
  room_code: string;
  quiz_id: string | null;
  host_id: string;
  status: 'waiting' | 'playing' | 'finished';
  current_question: number;
  max_players: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export const useMultiplayer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createRoom = async (quizId?: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to create a room', variant: 'destructive' });
      return null;
    }

    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          quiz_id: quizId || null,
          host_id: user.id,
          status: 'waiting',
        })
        .select()
        .single();

      if (roomError) throw roomError;

      const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
      
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          username: profile?.username || 'Player',
          avatar_url: profile?.avatar_url,
          is_ready: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setRoom(roomData as GameRoom);
      setPlayerId(playerData.id);
      setIsHost(true);
      return roomData;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomCode: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to join a room', variant: 'destructive' });
      return false;
    }

    setLoading(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (roomError || !roomData) {
        toast({ title: 'Room not found', description: 'Check the code and try again', variant: 'destructive' });
        return false;
      }

      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('id')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        setRoom(roomData as GameRoom);
        setPlayerId(existingPlayer.id);
        setIsHost(roomData.host_id === user.id);
        return true;
      }

      const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
      
      const { data: playerData, error: playerError } = await supabase
        .from('game_players')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          username: profile?.username || 'Player',
          avatar_url: profile?.avatar_url,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setRoom(roomData as GameRoom);
      setPlayerId(playerData.id);
      setIsHost(false);
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!room || !isHost) return false;
    
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'playing', started_at: new Date().toISOString(), current_question: 0 })
        .eq('id', room.id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const submitAnswer = async (questionIndex: number, answerIndex: number, isCorrect: boolean, timeTaken: number, pointsEarned: number) => {
    if (!room || !playerId) return false;
    
    try {
      await supabase.from('game_answers').insert({
        room_id: room.id,
        player_id: playerId,
        question_index: questionIndex,
        answer_index: answerIndex,
        is_correct: isCorrect,
        time_taken_ms: timeTaken,
        points_earned: pointsEarned,
      });

      const player = players.find(p => p.id === playerId);
      const newScore = (player?.score || 0) + pointsEarned;
      const newStreak = isCorrect ? (player?.current_streak || 0) + 1 : 0;

      await supabase
        .from('game_players')
        .update({ score: newScore, current_streak: newStreak, last_answer_correct: isCorrect })
        .eq('id', playerId);

      return true;
    } catch (error) {
      console.error('Error submitting answer:', error);
      return false;
    }
  };

  const nextQuestion = async () => {
    if (!room || !isHost) return;
    
    await supabase
      .from('game_rooms')
      .update({ current_question: room.current_question + 1 })
      .eq('id', room.id);
  };

  const endGame = async () => {
    if (!room || !isHost) return;
    
    await supabase
      .from('game_rooms')
      .update({ status: 'finished', ended_at: new Date().toISOString() })
      .eq('id', room.id);
  };

  const leaveRoom = async () => {
    if (!playerId) return;
    
    await supabase.from('game_players').delete().eq('id', playerId);
    setRoom(null);
    setPlayerId(null);
    setPlayers([]);
    setIsHost(false);
  };

  const setPlayerReady = async (ready: boolean) => {
    if (!playerId) return;
    await supabase.from('game_players').update({ is_ready: ready }).eq('id', playerId);
  };

  useEffect(() => {
    if (!room) return;

    const fetchPlayers = async () => {
      const { data } = await supabase.from('game_players').select('*').eq('room_id', room.id);
      if (data) setPlayers(data as Player[]);
    };

    fetchPlayers();

    const roomChannel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setRoom(payload.new as GameRoom);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${room.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPlayers(prev => [...prev, payload.new as Player]);
        } else if (payload.eventType === 'UPDATE') {
          setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new as Player : p));
        } else if (payload.eventType === 'DELETE') {
          setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [room?.id]);

  return {
    room,
    players,
    playerId,
    isHost,
    loading,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
    leaveRoom,
    setPlayerReady,
  };
};

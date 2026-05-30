import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  FileCheck,
  Image as ImageIcon,
  Loader,
  Send,
} from 'lucide-react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessageRecord, ConversationRecord, buildConversationId, timestampToDate } from '../lib/chat';
import { firebaseDb } from '../lib/firebase';
import Button from './ui/Button';
import Card from './ui/Card';
import { TextInput } from './ui/Field';

const Chat = () => {
  const { propertyId, conversationId: routeConversationId } = useParams();
  const navigate = useNavigate();
  const { properties } = useApp();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const property = properties.find((item) => item.id === propertyId || item.id === conversation?.propertyId);

  const derivedConversationId = useMemo(() => {
    if (routeConversationId) {
      return routeConversationId;
    }

    if (!propertyId || !property?.userId || !user?.id) {
      return null;
    }

    return buildConversationId(propertyId, user.id, property.userId);
  }, [routeConversationId, propertyId, property?.userId, user?.id]);

  useEffect(() => {
    if (!derivedConversationId) {
      setConversation(null);
      setIsLoadingConversation(false);
      return;
    }

    const conversationRef = doc(firebaseDb, 'conversations', derivedConversationId);

    const unsubscribe = onSnapshot(
      conversationRef,
      (conversationSnapshot) => {
        if (conversationSnapshot.exists()) {
          setConversation({
            id: conversationSnapshot.id,
            ...conversationSnapshot.data(),
          } as ConversationRecord);
        } else if (property && user?.id && property.userId) {
          setConversation({
            id: derivedConversationId,
            propertyId: property.id,
            propertyLocation: property.location,
            propertyImage: property.image,
            buyerId: user.id,
            sellerId: property.userId,
            buyerDisplayName: user.name || user.email || 'Buyer',
            sellerDisplayName: 'Property Owner',
            participantIds: [user.id, property.userId],
          });
        } else {
          setConversation(null);
        }

        setIsLoadingConversation(false);
      },
      () => {
        setErrorMessage('Unable to load this conversation right now.');
        setIsLoadingConversation(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [derivedConversationId, property, user?.email, user?.id, user?.name]);

  useEffect(() => {
    if (!derivedConversationId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(firebaseDb, 'conversations', derivedConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs.map(
          (messageDoc) =>
            ({
              id: messageDoc.id,
              ...messageDoc.data(),
            } as ChatMessageRecord)
        );
        setMessages(nextMessages);
      },
      () => {
        setErrorMessage('Unable to load messages right now.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [derivedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return <div className="app-shell flex min-h-screen items-center justify-center">Please log in.</div>;
  }

  if (propertyId && !property) {
    return <div className="app-shell flex min-h-screen items-center justify-center">Property not found</div>;
  }

  const isOwnListing = !!property && property.userId === user.id;
  const chatUnavailable = !!property && !property.userId;
  const counterpartName =
    conversation?.sellerId === user.id
      ? conversation?.buyerDisplayName || 'Buyer'
      : conversation?.sellerDisplayName || 'Property Owner';

  const handleSend = async () => {
    if (!newMessage.trim() || !derivedConversationId || !conversation) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage('');

      const conversationRef = doc(firebaseDb, 'conversations', derivedConversationId);
      const existingConversation = await getDoc(conversationRef);
      const trimmedMessage = newMessage.trim();

      if (!existingConversation.exists()) {
        await setDoc(conversationRef, {
          propertyId: conversation.propertyId,
          propertyLocation: conversation.propertyLocation,
          propertyImage: conversation.propertyImage || property?.image || '',
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
          buyerDisplayName: conversation.buyerDisplayName || user.name || user.email || 'Buyer',
          sellerDisplayName: conversation.sellerDisplayName || 'Property Owner',
          participantIds: conversation.participantIds,
          lastMessage: trimmedMessage,
          lastMessageSenderId: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(conversationRef, {
          lastMessage: trimmedMessage,
          lastMessageSenderId: user.id,
          updatedAt: serverTimestamp(),
          buyerDisplayName:
            conversation.buyerId === user.id
              ? user.name || user.email || 'Buyer'
              : conversation.buyerDisplayName || 'Buyer',
        });
      }

      await addDoc(collection(firebaseDb, 'conversations', derivedConversationId, 'messages'), {
        text: trimmedMessage,
        senderId: user.id,
        senderDisplayName: user.name || user.email || 'User',
        createdAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch {
      setErrorMessage('Unable to send the message right now. Check Firebase rules and try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <header className="hero-gradient sticky top-0 z-40 border-b border-white/10 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
        <div className="page-container py-5">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="glass-panel flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white">{counterpartName}</h1>
              <p className="mt-1 truncate text-sm text-blue-100">
                {conversation?.propertyLocation || property?.location || 'Conversation'}
              </p>
              {(property?.verified || conversation) && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {property?.verified ? 'Verified Listing' : 'Property Conversation'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="page-container flex flex-1 flex-col gap-6 py-6">
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-bold text-slate-950">Quick Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-950">Request Property Proof</div>
                <div className="text-sm text-slate-500">Ask for ownership documents.</div>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-950">Schedule Visit</div>
                <div className="text-sm text-slate-500">Propose a site visit time.</div>
              </div>
            </button>
          </div>
        </Card>

        {chatUnavailable ? (
          <Card className="p-8 text-center text-slate-600">
            Chat is not available for this listing because no seller account is linked to it yet.
          </Card>
        ) : isOwnListing && !routeConversationId ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-950">This is your listing</h2>
            <p className="mt-2 text-sm text-slate-600">
              Buyers will appear in your inbox after they send the first message.
            </p>
            <Button onClick={() => navigate('/messages')} className="mt-6">
              Open Messages
            </Button>
          </Card>
        ) : isLoadingConversation ? (
          <Card className="p-8 text-center text-slate-600">
            <Loader className="mx-auto h-6 w-6 animate-spin" />
            <div className="mt-3">Loading conversation...</div>
          </Card>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <div className="flex-1 space-y-4 overflow-y-auto pb-2">
              {messages.length ? (
                messages.map((message) => {
                  const isMine = message.senderId === user.id;
                  const sentAt = timestampToDate(message.createdAt);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-soft md:max-w-xl ${
                          isMine
                            ? 'rounded-br-md bg-slate-950 text-white'
                            : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
                        }`}
                      >
                        <p className="text-sm leading-6">{message.text}</p>
                        <p
                          className={`mt-2 text-xs font-medium ${
                            isMine ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {sentAt
                            ? sentAt.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Sending...'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <Card className="p-8 text-center text-slate-600">
                  No messages yet. Send the first message to start this conversation.
                </Card>
              )}
              <div ref={messagesEndRef} />
            </div>

            {errorMessage && (
              <Card className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </Card>
            )}
          </div>
        )}
      </main>

      {!chatUnavailable && !(isOwnListing && !routeConversationId) && (
        <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="page-container py-4">
            <Card className="p-3">
              <div className="flex items-end gap-3">
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                  <ImageIcon className="h-5 w-5" />
                </button>

                <TextInput
                  type="text"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="h-12 flex-1 rounded-2xl border-0 bg-slate-50 shadow-none focus:bg-white focus:ring-4"
                />

                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-12 w-12 rounded-2xl"
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseDb } from '../lib/firebase';
import { ConversationRecord, timestampToDate } from '../lib/chat';
import Button from './ui/Button';
import Card from './ui/Card';

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const conversationsQuery = query(
      collection(firebaseDb, 'conversations'),
      where('participantIds', 'array-contains', user.id)
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const nextConversations = snapshot.docs
          .map(
            (conversationDoc) =>
              ({
                id: conversationDoc.id,
                ...conversationDoc.data(),
              } as ConversationRecord)
          )
          .sort((left, right) => {
            const leftTime = timestampToDate(left.updatedAt)?.getTime() || 0;
            const rightTime = timestampToDate(right.updatedAt)?.getTime() || 0;
            return rightTime - leftTime;
          });

        setConversations(nextConversations);
        setIsLoading(false);
      },
      () => {
        setConversations([]);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const conversationCards = useMemo(
    () =>
      conversations.map((conversation) => {
        const isSellerView = conversation.sellerId === user?.id;
        const counterpartName = isSellerView
          ? conversation.buyerDisplayName || 'Buyer'
          : conversation.sellerDisplayName || 'Property Owner';
        const lastMessageAt = timestampToDate(conversation.updatedAt);

        return (
          <button
            key={conversation.id}
            onClick={() => navigate(`/chat/conversation/${conversation.id}`)}
            className="w-full text-left"
          >
            <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float">
              <div className="flex items-start gap-4">
                {conversation.propertyImage ? (
                  <img
                    src={conversation.propertyImage}
                    alt={conversation.propertyLocation}
                    className="h-20 w-20 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-slate-950">
                        {counterpartName}
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-500">
                        {conversation.propertyLocation}
                      </div>
                    </div>
                    {lastMessageAt && (
                      <div className="shrink-0 text-xs font-medium text-slate-400">
                        {lastMessageAt.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 truncate text-sm text-slate-600">
                    {conversation.lastMessage || 'No messages yet'}
                  </div>
                </div>
              </div>
            </Card>
          </button>
        );
      }),
    [conversations, navigate, user?.id]
  );

  return (
    <div className="app-shell min-h-screen pb-16">
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
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <p className="mt-1 text-sm text-blue-100">
                Buyer and seller conversations for your properties and interests.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container py-8">
        {isLoading ? (
          <Card className="p-8 text-center text-slate-600">Loading conversations...</Card>
        ) : conversations.length ? (
          <div className="space-y-4">{conversationCards}</div>
        ) : (
          <Card className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-950">No conversations yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start a chat from a property page as a buyer, or wait for a buyer to message you as a seller.
            </p>
            <Button onClick={() => navigate('/home-auth')} className="mt-6">
              Browse Properties
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Messages;

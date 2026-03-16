import { Loader2, Star, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAllFeedback } from '@/hooks/useFeedback';

export function FeedbackViewer() {
  const { data: feedbackList = [], isLoading } = useAllFeedback();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const avgRating = feedbackList.length > 0
    ? (feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackList.length).toFixed(1)
    : '0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedbackList.filter((f) => f.rating === star).length,
    percent: feedbackList.length > 0
      ? Math.round((feedbackList.filter((f) => f.rating === star).length / feedbackList.length) * 100)
      : 0,
  }));

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{avgRating}</p>
            <div className="flex justify-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Rating Rata-rata</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{feedbackList.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Total Ulasan</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Distribusi Rating</p>
            {ratingDistribution.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3">{star}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-6 text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Ulasan Terbaru
        </h3>
        {feedbackList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Belum ada ulasan dari pelanggan.</div>
        ) : (
          feedbackList.map((f) => {
            const order = f.orders as any;
            const tableNum = order?.tables?.table_number;
            const menuNames = (order?.order_items || [])
              .map((oi: any) => oi.menu_items?.name)
              .filter(Boolean);

            return (
              <Card key={f.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= (f.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                        {tableNum && (
                          <Badge variant="outline" className="text-xs">Meja {tableNum}</Badge>
                        )}
                      </div>
                      {f.comment && (
                        <p className="text-sm text-foreground mt-1">"{f.comment}"</p>
                      )}
                      {menuNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {menuNames.map((name: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {f.created_at ? formatDate(f.created_at) : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useAllFeedback, useMenuItemRatings, getRatingColor } from '@/hooks/useRatings';
import { useMenuItems } from '@/hooks/useMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, TrendingDown, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminRatingTab() {
  const { data: feedback = [], isLoading: feedbackLoading } = useAllFeedback();
  const { data: ratings = [], isLoading: ratingsLoading } = useMenuItemRatings();
  const { data: menuItems = [] } = useMenuItems();

  const isLoading = feedbackLoading || ratingsLoading;

  const getMenuName = (menuItemId: string) => {
    return menuItems.find((m) => m.id === menuItemId)?.name || 'Menu tidak diketahui';
  };

  // Calculate stats
  const totalReviews = feedback.filter((f) => f.rating).length;
  const avgRating = totalReviews > 0
    ? feedback.reduce((acc, f) => acc + (f.rating || 0), 0) / totalReviews
    : 0;

  const sortedRatings = [...ratings].sort((a, b) => b.avg_rating - a.avg_rating);
  const highestRated = sortedRatings[0];
  const lowestRated = sortedRatings[sortedRatings.length - 1];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-1 text-yellow-400 fill-yellow-400" />
            <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Rating Rata-rata</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalReviews}</p>
            <p className="text-xs text-muted-foreground">Total Ulasan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <p className="text-sm font-bold truncate">
              {highestRated ? getMenuName(highestRated.menu_item_id) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">
              Rating Tertinggi {highestRated ? `(${highestRated.avg_rating})` : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingDown className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <p className="text-sm font-bold truncate">
              {lowestRated ? getMenuName(lowestRated.menu_item_id) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">
              Rating Terendah {lowestRated ? `(${lowestRated.avg_rating})` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating per Menu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rating per Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedRatings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada rating</p>
          ) : (
            sortedRatings.map((r) => (
              <div key={r.menu_item_id} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">
                  {getMenuName(r.menu_item_id)}
                </span>
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 fill-current ${getRatingColor(r.avg_rating)}`} />
                  <span className="text-sm font-bold">{r.avg_rating}</span>
                  <Badge variant="secondary" className="text-xs">
                    {r.total_reviews} ulasan
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* All Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semua Ulasan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada ulasan</p>
          ) : (
            feedback.map((f) => (
              <div key={f.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= (f.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {f.created_at
                      ? new Date(f.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
                {f.comment && (
                  <p className="text-sm text-foreground">{f.comment}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

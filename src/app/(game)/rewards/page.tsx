import { EmptyState, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { publicRewardImage } from "@/lib/media";
import { getRewardShop } from "@/lib/rewards";

export default async function RewardsPage() {
  const { profile } = await requireUser();
  const shop = await getRewardShop();

  return (
    <div>
      <PageHeader title="استبدال الكوينز" subtitle={`معاك ${formatNumber(profile.coins)} كوينز من اللي جمعتهم.`} />
      {shop.comingSoon ? (
        <section className="card px-5 py-12 text-center">
          <p className="text-5xl">🎁</p>
          <h2 className="mt-3 text-2xl font-black">قريبًا</h2>
          <p className="mx-auto mt-2 max-w-md leading-7 text-slate-300">
            المكافآت اللي هتستبدل بيها الكوينز لسه بتجهز. الزرار مقفول دلوقتي.
          </p>
          <button type="button" className="btn btn-primary btn-soon mt-5" disabled>
            قريبًا
          </button>
        </section>
      ) : shop.rewards.length === 0 ? (
        <EmptyState title="لسه مفيش مكافآت" body="لما تتضاف مكافآت، هتقدر تشوف هنا تاخد إيه بالكوينز." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shop.rewards.map((item) => {
            const affordable = profile.coins >= item.coins;
            const missing = item.coins - profile.coins;
            const image = publicRewardImage(item.image_path);
            return (
              <article key={item.id} className="card p-4">
                {image ? <img src={image} alt="" className="mb-3 h-44 w-full rounded-2xl object-cover" /> : null}
                <h2 className="text-lg font-extrabold">{item.title}</h2>
                {item.description ? <p className="mt-1 text-sm leading-7 text-slate-300">{item.description}</p> : null}
                <p className="mt-3 font-extrabold text-amber-200">🪙 {formatNumber(item.coins)} كوينز</p>
                <p className={`mt-1 text-sm font-bold ${affordable ? "text-emerald-200" : "text-slate-300"}`}>
                  {affordable ? "كوينزك تكفي للمكافأة دي" : `محتاج ${formatNumber(missing)} كوينز كمان`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

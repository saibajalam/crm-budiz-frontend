import Banner from "./components/Banner";
import HistoryCard from "./components/HistoryCard";
import TopCreatorTable from "./components/TableTopCreators";
import NftCard from "components/card/NftCard";
import {
  useMarketplaceRecent,
  useMarketplaceTopCreators,
  useMarketplaceTrending,
} from "domains/marketplace/hooks";

const Marketplace = () => {
  const { data: trendingRaw, isLoading } = useMarketplaceTrending();
  const { data: recentRaw } = useMarketplaceRecent();
  const { data: creatorsRaw } = useMarketplaceTopCreators();

  const normalize = (d) => (Array.isArray(d) ? d : d?.data || []);
  const trending = normalize(trendingRaw);
  const recent = normalize(recentRaw);
  const topCreators = normalize(creatorsRaw);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      <div className="col-span-1 h-fit w-full xl:col-span-1 2xl:col-span-2">
        {/* NFt Banner */}
        <Banner />

        {/* NFt Header */}
        <div className="mb-4 mt-5 flex flex-col justify-between px-4 md:flex-row md:items-center">
          <h4 className="ml-1 text-2xl font-bold text-navy-700 dark:text-white">
            Trending NFTs
          </h4>
          <ul className="mt-4 flex items-center justify-between md:mt-0 md:justify-center md:!gap-5 2xl:!gap-12">
            <li>
              <a className="text-base font-medium text-brand-500 hover:text-brand-500 dark:text-white" href=" ">Art</a>
            </li>
            <li>
              <a className="text-base font-medium text-brand-500 hover:text-brand-500 dark:text-white" href=" ">Music</a>
            </li>
            <li>
              <a className="text-base font-medium text-brand-500 hover:text-brand-500 dark:text-white" href=" ">Collection</a>
            </li>
            <li>
              <a className="text-base font-medium text-brand-500 hover:text-brand-500 dark:text-white" href=" ">Sports</a>
            </li>
          </ul>
        </div>

        {/* NFTs trending card */}
        <div className="z-20 grid grid-cols-1 gap-5 md:grid-cols-3">
          {trending.length === 0 ? (
            <p className="col-span-3 py-8 text-center text-gray-500">No trending items</p>
          ) : (
            trending.map((item, idx) => (
              <NftCard
                key={item.id || idx}
                bidders={item.bidders || []}
                title={item.title}
                author={item.author}
                price={item.price}
                image={item.image}
              />
            ))
          )}
        </div>

        {/* Recently Added section */}
        <div className="mb-5 mt-5 flex items-center justify-between px-[26px]">
          <h4 className="text-2xl font-bold text-navy-700 dark:text-white">
            Recently Added
          </h4>
        </div>

        {/* Recently Add NFTs */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {recent.length === 0 ? (
            <p className="col-span-3 py-8 text-center text-gray-500">No recent items</p>
          ) : (
            recent.map((item, idx) => (
              <NftCard
                key={item.id || idx}
                bidders={item.bidders || []}
                title={item.title}
                author={item.author}
                price={item.price}
                image={item.image}
              />
            ))
          )}
        </div>
      </div>

      {/* right side section */}
      <div className="col-span-1 h-full w-full rounded-xl 2xl:col-span-1">
        <TopCreatorTable extra="mb-5" tableData={topCreators} />
        <HistoryCard />
      </div>
    </div>
  );
};

export default Marketplace;

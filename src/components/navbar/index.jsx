import React from "react";
import Dropdown from "components/dropdown";
import { FiAlignJustify } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import navbarimage from "assets/img/layout/Navbar.png";
import { BsArrowBarUp } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import {
  IoMdNotificationsOutline,
  IoMdInformationCircleOutline,
} from "react-icons/io";
import { useNotifications } from "domains/notifications/hooks";
import { useProfile } from "domains/profile/hooks";
import { useDebouncedSearchValue, useSearchAll } from "domains/search/hooks";

const normalizeSearchData = (rawData) => {
  if (!rawData) return { deals: [], contacts: [], activities: [] };
  return {
    deals: rawData.deals || rawData.deal_results || [],
    contacts: rawData.contacts || rawData.contact_results || [],
    activities: rawData.activities || rawData.activity_results || [],
  };
};

const Navbar = (props) => {
  const { onOpenSidenav, brandText } = props;
  const navigate = useNavigate();
  const [darkmode, setDarkmode] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const searchRef = React.useRef(null);
  const debouncedQuery = useDebouncedSearchValue(searchTerm, 300);
  const { data: searchData, isFetching: searchLoading } = useSearchAll(debouncedQuery, {
    enabled: debouncedQuery.length > 1,
  });

  const { data: notificationsData } = useNotifications();

  const { data: profile } = useProfile();

  const notifications = Array.isArray(notificationsData)
    ? notificationsData
    : notificationsData?.results || [];

  const userName = profile?.name || profile?.first_name || "User";
  const avatarUrl = profile?.avatar || null;
  const groupedResults = normalizeSearchData(searchData);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchRef.current || searchRef.current.contains(event.target)) return;
      setSearchOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults =
    groupedResults.deals.length > 0 ||
    groupedResults.contacts.length > 0 ||
    groupedResults.activities.length > 0;

  const renderResultButton = (item, type, idx) => {
    const key = `${type}-${item.id || idx}`;
    const label = item.name || item.title || item.note || item.message || `${type} #${item.id}`;
    const subtitle = item.email || item.stage_name || item.type || "";

    const handleOpen = () => {
      setSearchOpen(false);
      if (type === "deals") {
        navigate(`/admin/deals/${item.id}`);
        return;
      }
      if (type === "contacts") {
        navigate("/admin/tables");
        return;
      }
      if (type === "activities") {
        navigate(item.deal_id ? `/admin/deals/${item.deal_id}` : "/admin/deals-pipeline");
      }
    };

    return (
      <button
        key={key}
        type="button"
        onClick={handleOpen}
        className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-100 dark:hover:bg-white/5"
      >
        <p className="font-semibold text-navy-700 dark:text-white">{label}</p>
        {subtitle ? <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
      </button>
    );
  };

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="ml-[6px]">
        <div className="h-6 w-[224px] pt-1">
          <a
            className="text-sm font-normal text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href=" "
          >
            Pages
            <span className="mx-1 text-sm text-navy-700 hover:text-navy-700 dark:text-white">
              {" "}
              /{" "}
            </span>
          </a>
          <Link
            className="text-sm font-normal capitalize text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            to="#"
          >
            {brandText}
          </Link>
        </div>
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <Link
            to="#"
            className="font-bold capitalize hover:text-navy-700 dark:hover:text-white"
          >
            {brandText}
          </Link>
        </p>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-[355px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[430px] xl:gap-2">
        <div
          ref={searchRef}
          className="relative flex h-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white xl:w-[270px]"
        >
          <p className="pl-3 pr-2 text-xl">
            <FiSearch className="h-4 w-4 text-gray-400 dark:text-white" />
          </p>
          <input
            type="text"
            value={searchTerm}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search deals, contacts, activities..."
            className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-white"
          />

          {searchOpen && searchTerm.trim().length > 1 ? (
            <div className="absolute left-0 top-[58px] z-50 max-h-[360px] w-[320px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-navy-800">
              {searchLoading ? (
                <p className="p-2 text-sm text-gray-500 dark:text-gray-300">Searching...</p>
              ) : !hasResults ? (
                <p className="p-2 text-sm text-gray-500 dark:text-gray-300">No results found</p>
              ) : (
                <div className="space-y-2">
                  {groupedResults.deals.length > 0 ? (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Deals</p>
                      <div className="space-y-1">
                        {groupedResults.deals.slice(0, 4).map((item, idx) => renderResultButton(item, "deals", idx))}
                      </div>
                    </div>
                  ) : null}

                  {groupedResults.contacts.length > 0 ? (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Contacts</p>
                      <div className="space-y-1">
                        {groupedResults.contacts.slice(0, 4).map((item, idx) => renderResultButton(item, "contacts", idx))}
                      </div>
                    </div>
                  ) : null}

                  {groupedResults.activities.length > 0 ? (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Activities</p>
                      <div className="space-y-1">
                        {groupedResults.activities
                          .slice(0, 4)
                          .map((item, idx) => renderResultButton(item, "activities", idx))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>
        {/* start Notification */}
        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdNotificationsOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            </p>
          }
          animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
          children={
            <div className="flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none sm:w-[460px]">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-navy-700 dark:text-white">
                  Notification
                </p>
                <p className="text-sm font-bold text-navy-700 dark:text-white">
                  Mark all read
                </p>
              </div>

              {notifications.length === 0 ? (
                <p className="px-2 text-sm text-gray-500">No new notifications</p>
              ) : (
                notifications.map((n, idx) => (
                  <button key={n.id || idx} className="flex w-full items-center">
                    <div className="flex h-full w-[85px] items-center justify-center rounded-xl bg-gradient-to-b from-brandLinear to-brand-500 py-4 text-2xl text-white">
                      <BsArrowBarUp />
                    </div>
                    <div className="ml-2 flex h-full w-full flex-col justify-center rounded-lg px-1 text-sm">
                      <p className="mb-1 text-left text-base font-bold text-gray-900 dark:text-white">
                        {n.title || "Notification"}
                      </p>
                      <p className="font-base text-left text-xs text-gray-900 dark:text-white">
                        {n.message || n.description || ""}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          }
          classNames={"py-2 top-4 -left-[230px] md:-left-[440px] w-max"}
        />
        {/* start Horizon PRO */}
        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdInformationCircleOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            </p>
          }
          children={
            <div className="flex w-[350px] flex-col gap-2 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <div
                style={{
                  backgroundImage: `url(${navbarimage})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }}
                className="mb-2 aspect-video w-full rounded-lg"
              />
              <a
                target="blank"
                href="https://horizon-ui.com/pro?ref=live-free-tailwind-react"
                className="px-full linear flex cursor-pointer items-center justify-center rounded-xl bg-brand-500 py-[11px] font-bold text-white transition duration-200 hover:bg-brand-600 hover:text-white active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200"
              >
                Buy Horizon UI PRO
              </a>
              <a
                target="blank"
                href="https://horizon-ui.com/docs-tailwind/docs/react/installation?ref=live-free-tailwind-react"
                className="px-full linear flex cursor-pointer items-center justify-center rounded-xl border py-[11px] font-bold text-navy-700 transition duration-200 hover:bg-gray-200 hover:text-navy-700 dark:!border-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white dark:active:bg-white/10"
              >
                See Documentation
              </a>
              <a
                target="blank"
                href="https://horizon-ui.com/?ref=live-free-tailwind-react"
                className="hover:bg-black px-full linear flex cursor-pointer items-center justify-center rounded-xl py-[11px] font-bold text-navy-700 transition duration-200 hover:text-navy-700 dark:text-white dark:hover:text-white"
              >
                Try Horizon Free
              </a>
            </div>
          }
          classNames={"py-2 top-6 -left-[250px] md:-left-[330px] w-max"}
          animation="origin-[75%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
        />
        <div
          className="cursor-pointer text-gray-600"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove("dark");
              setDarkmode(false);
            } else {
              document.body.classList.add("dark");
              setDarkmode(true);
            }
          }}
        >
          {darkmode ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </div>
        {/* Profile & Dropdown */}
        <Dropdown
          button={
            avatarUrl ? (
              <img
                className="h-10 w-10 cursor-pointer rounded-full"
                src={avatarUrl}
                alt="profile"
              />
            ) : (
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                {userName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )
          }
          children={
            <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-navy-700 dark:text-white">
                    👋 Hey, {userName || "User"}
                  </p>{" "}
                </div>
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-white/20 " />

              <div className="flex flex-col p-4">
                <a
                  href=" "
                  className="text-sm text-gray-800 dark:text-white hover:dark:text-white"
                >
                  Profile Settings
                </a>
                <a
                  href=" "
                  className="mt-3 text-sm text-gray-800 dark:text-white hover:dark:text-white"
                >
                  Newsletter Settings
                </a>
                <button
                  onClick={() => {
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");
                    localStorage.removeItem("workspace_id");
                    window.location.href = "/auth/sign-in";
                  }}
                  className="mt-3 text-sm font-medium text-red-500 hover:text-red-500 transition duration-150 ease-out hover:ease-in text-left"
                >
                  Log Out
                </button>
              </div>
            </div>
          }
          classNames={"py-2 top-8 -left-[180px] w-max"}
        />
      </div>
    </nav>
  );
};

export default Navbar;

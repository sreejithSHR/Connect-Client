import { MdHomeFilled as HomeIcon } from "react-icons/md";
import { MdLiveTv as BrowseIcon } from "react-icons/md";

export const sideMenuData = [
  {
    text: "Home",
    icon: <HomeIcon />,
    route: "/",
  },
  {
    text: "Browse",
    icon: <BrowseIcon />,
    route: "/browse",
  },
];

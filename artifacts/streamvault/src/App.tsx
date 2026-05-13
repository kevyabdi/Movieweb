import { Switch as WouterSwitch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ThemeProvider } from "@/context/ThemeContext";
import { WatchHistoryProvider } from "@/context/WatchHistoryContext";
import { MyListProvider } from "@/context/MyListContext";
import { ContentLibraryProvider } from "@/context/ContentLibraryContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { BannersProvider } from "@/context/BannersContext";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/home";
import Movies from "@/pages/movies";
import TvSeries from "@/pages/tv-series";
import Search from "@/pages/search";
import Settings from "@/pages/settings";
import MovieDetail from "@/pages/movie-detail";
import CategoryPage from "@/pages/category";
import MyListPage from "@/pages/my-list";
import ActorsPage from "@/pages/actors";
import ActorDetail from "@/pages/actor-detail";
import Subscribe from "@/pages/subscribe";
import YearPage from "@/pages/year";
import AuthPage from "@/pages/auth";
import ProfilePage from "@/pages/profile";

const queryClient = new QueryClient();

function Router() {
  return (
    <WouterSwitch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Home} />
      <Route path="/movies" component={Movies} />
      <Route path="/tv-series" component={TvSeries} />
      <Route path="/search" component={Search} />
      <Route path="/settings" component={Settings} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/my-list" component={MyListPage} />
      <Route path="/actors" component={ActorsPage} />
      <Route path="/actor/:name" component={ActorDetail} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/year" component={YearPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </WouterSwitch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WatchHistoryProvider>
          <MyListProvider>
            <QueryClientProvider client={queryClient}>
              <CategoriesProvider>
                <BannersProvider>
                  <ContentLibraryProvider>
                    <TooltipProvider>
                      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                        <Layout>
                          <Router />
                        </Layout>
                      </WouterRouter>
                      <Toaster />
                    </TooltipProvider>
                  </ContentLibraryProvider>
                </BannersProvider>
              </CategoriesProvider>
            </QueryClientProvider>
          </MyListProvider>
        </WatchHistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

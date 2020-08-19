import React, { useEffect, useState, useRef, Dispatch, SetStateAction, MutableRefObject } from "react";
import { StyleSheet, Platform } from "react-native";

import Me from "./profile/Me";
import QueuePage from "./queue-view/queue-page";
import ProfilePage from "./profile/profile-page";
import { BusinessListScreen } from "./feed/feed";
import { BusinessLocation, copyBusLoc } from "./util/business";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  ApplicationProvider,
  BottomNavigation,
  BottomNavigationTab,
  Icon,
  IconRegistry,
} from "@ui-kitten/components";
import * as eva from "@eva-design/eva";
import { default as theme } from "./custom-theme.json";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import { Customer } from "./util/customer"
import { getCustomer, getAllBusinessLocations, getBusinessLocationsFromArray, postCustomer, getQueue, newCustomer } from "./util/api-functions";
import { auth } from './firebase';
import { Queue } from "./util/queue";
import { getBusPic } from "./util/storage-func";
import * as Permissions from "expo-permissions";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const Tab = createBottomTabNavigator();

const FeedIcon = (props: any) => <Icon {...props} name="browser-outline" />;
const QueueIcon = (props: any) => <Icon {...props} name="list-outline" />;


const BottomTabBar = (Navigator: {
  state: { index: number | undefined; routeNames: any[] };
  navigation: { navigate: (arg0: any) => void };
}) => (
    <BottomNavigation
      selectedIndex={Navigator.state.index}
      style={styles.bottomNavigation}
      onSelect={(index) =>
        Navigator.navigation.navigate(Navigator.state.routeNames[index])

      }
    >
      <BottomNavigationTab icon={FeedIcon} title="FEED" />
      {/*<BottomNavigationTab icon={MeIcon} title="ME" />*/}
      <BottomNavigationTab icon={QueueIcon} title="QUEUE" />
    </BottomNavigation>
  );

interface TabProps {
  setUser: (c: Customer) => void,
  currUser: Customer,
  setFavs: (b: string[]) => void,
  setRecents: (b: string[]) => void,
  feedLists: [string[], string[], BusinessLocation[]],
  setQueueBusiness: (b: BusinessLocation | undefined) => void,
  business: BusinessLocation | undefined,
  queueId: string,
  setQueueId: (s: string) => void,
  assetsMap: Map<string, string>,
  businessMap: Map<string, BusinessLocation>,
}

export interface RenderProps {
  setUser: (c: Customer) => void,
  currUser: Customer,
}

const TabNavigator = ({
  setUser,
  currUser,
  setQueueBusiness,
  business,
  setFavs,
  feedLists,
  queueId,
  setQueueId,
  setRecents,
  assetsMap,
  businessMap
}: TabProps) => (
  <Tab.Navigator tabBar={(props) => <BottomTabBar {...props} />}>
    <Tab.Screen name="Feed">
      {() => <BusinessListScreen
        setQueueBusiness={setQueueBusiness}
        setFavs={setFavs}
        feedList={feedLists}
        currUser={currUser}
        setQueueId={setQueueId}
        queueId={queueId}
        setUser={setUser}
        setRecents={setRecents}
        assetsMap={assetsMap}
        businessMap={businessMap}
      />}
    </Tab.Screen>
    {/*<Tab.Screen name="Me">
      {() => <ProfileWrapper setUser={setUser} currUser={currUser} />}
      </Tab.Screen>*/}
    <Tab.Screen name="Queue">
      {() => <QueuePage
        queueId={queueId}
        setQueueBusiness={setQueueBusiness}
        setQueueId={setQueueId}
        currUser={currUser}
        setUser={setUser}
        businessName={business?.name}
      />}
    </Tab.Screen>
  </Tab.Navigator>
);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// const ProfileWrapper = ({ setUser, currUser }: RenderProps) => (
//   currUser.uid.length > 0 ? <ProfilePage setUser={setUser} currUser={currUser} /> : <Me setUser={setUser} currUser={currUser} />
// );

export default function App() {

  const [currUser, setUser] = useState<Customer>(new Customer());
  const [recents, setRecents] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [businesses, setBusinesses] = useState<BusinessLocation[]>([]);
  const [businessMap, setBusinessMap] = useState<Map<string, BusinessLocation>>(new Map);
  const [business, setBusiness] = useState<BusinessLocation | undefined>(); // business that you are in a queue with
  const [queueId, setQueueId] = useState<string>('');
  const [assetsMap, setAssets] = useState<Map<string, string>>(new Map);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  async function registerForPushNotificationsAsync() {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async function (user) {
      if (user) {
        let customer: Customer;

        try {
          customer = await getCustomer(user.uid);
        } catch (errror) {
          let userToken = (await registerForPushNotificationsAsync())!;
          customer = await newCustomer(user.uid, userToken);
          setExpoPushToken(userToken);

          // This listener is fired whenever a notification is received while the app is foregrounded
          notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(true);
          });

          // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
          responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
          });
        }

        const businessLocations = await getAllBusinessLocations();

        const newMap = new Map<string, BusinessLocation>();
        for (const biz of businessLocations) {
          if (biz.queues[0] === customer.currentQueue) {
            setBusiness(biz);
          }
          newMap.set(biz.uid, biz);
        }

        setBusinesses(businessLocations);
        setBusinessMap(newMap);
        setRecents(customer.recents);
        setFavs(customer.favorites);
        setQueueId(customer.currentQueue);
        setUser(customer);
      } else {
        auth.signInAnonymously().catch((error) => {
          console.error(error);
        });
      }
    });

    return () => {
      unsub();
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    setImageURL(businesses);
  }, [businesses]);

  const setImageURL = async (feedList: BusinessLocation[]) => {
    let newMap = new Map(assetsMap);
    for (let i = 0; i < feedList.length; i++) {
      // Check if business have image
      if (feedList[i].images.length != 0) {
        // Check if map have image for business
        if (!newMap.has(feedList[i].uid)) {
          await getBusPic(feedList[i].uid, feedList[i].images[0], (URL: string) => {
            newMap.set(feedList[i].uid, URL);
          });
        }
      }
    }
    setAssets(newMap);
  }

  useEffect(() => {
    if (currUser.uid.length !== 0 && currUser.favorites.length !== favs.length) {
      const newCustomer = {
        ...currUser,
        favorites: favs,
      };
      setUser(newCustomer);
    }
  }, [favs, currUser]);


  useEffect(() => {
    if (currUser.uid.length !== 0 && currUser.recents.length !== recents.length) {
      const newCustomer = {
        ...currUser,
        recents: recents,
      };
      setUser(newCustomer);
    }
  }, [recents, currUser]);


  useEffect(() => {
    if (currUser.uid.length !== 0) {
      postCustomer(currUser);
    }
  }, [currUser]);


  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={{ ...eva.dark, ...theme }}>
        <NavigationContainer>
          <TabNavigator
            setUser={setUser}
            feedLists={[favs, recents, businesses]}
            currUser={currUser}
            setFavs={setFavs}
            setRecents={setRecents}
            setQueueBusiness={setBusiness}
            business={business}
            queueId={queueId}
            setQueueId={setQueueId}
            assetsMap={assetsMap}
            businessMap={businessMap}
          />
        </NavigationContainer>
      </ApplicationProvider>
    </>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    display: "flex",
    alignItems: "flex-start",
    height: 70,
    backgroundColor: theme['color-basic-1100'],
  },
});
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Geocoder from "react-native-geocoding";
import MapViewDirections from "react-native-maps-directions";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  AnimatedRegion,
} from "react-native-maps";
import styles from "./Tracking.styles";
import COLORS from "../../Constants/Theme/Color";
import kEYS from "../../Constants/appConstants/Global";
import RouteNames from "../../Navigation/routeNames";
import person from "../../assets/images/dummyUser.jpg";
import carImage from "../../assets/images/cars/UberX.jpeg";
import trackingMarker from "../../assets/images/cars/top-uberx-tracking.png";
import StarIcon from "../../assets/images/star.png";
import chatIcon from "../../assets/images/chat.png";
import callIcon from "../../assets/images/call.png";
import MapPin from "../../assets/images/mapPin.png";
import LocationIcon from "../../assets/images/current-location.png";
import { socket } from "../../Store/store";

const screen = Dimensions.get("window");
const AspectRatio = screen.width / screen.height;
const latitudeDelta = 0.9222;
const longitudeDelta = latitudeDelta * AspectRatio;

const getCurrentTrip = (actions, request, setLoading) => {
  const data = {
    tripId: request.requestId,
  };
  actions
    .actionGetCurrentTrip(data)
    .then(() => {
      setLoading(false);

      // actions.user.actionGetRequests().then(() => {
      //   setLoading(false);
      //   setOnline(true);
      // });
    })
    .catch((e) => console.log(e))
    .then(() => {});
};

const Tracking = ({
  actions,
  navigation,
  requestData,
  requestError,
  requestStatus,
  tripData,
  user,
}) => {
 
  const destinationAddress =
    requestData && requestData.destination ? requestData.destination : "";
  const sourceAddress =
    requestData && requestData.source ? requestData.source : "";
  const mapRegion = tripData
    ? {
        latitude: tripData.userLat,
        longitude: tripData.userLong,
        latitudeDelta: 0.9222,
        longitudeDelta: 0.0034,
      }
    : {
        latitude: 31.470739629384877,
        longitude: 74.35874729999999,
        latitudeDelta: 0.9222,
        longitudeDelta: 0.0034,
      };
  const selectedItem = tripData && tripData.item ? tripData.item : {};
  const distance = selectedItem.distance ? selectedItem.distance : 0;
  const time = selectedItem.time ? selectedItem.time : 0;
  const fare = tripData ? tripData.fare : 0;
  let mapRef = useRef(null);
  let trackingRef = useRef(null);

  Geocoder.init(kEYS.GEO_CODER_KEY, { language: "en" });
  const [sourcelocation, setSourceLocation] = useState({
    latitude: tripData.driverLat || 31.470739629384877,
    longitude: tripData.driverLong || 74.27279481051957,
  });
  const [liveLocation, setLiveLocation] = useState({
    coordinate: new AnimatedRegion({
      latitude: 31.470739629384877,
      longitude: 74.27279481051957,
      latitudeDelta: 0.9222,
      longitudeDelta: 0.0034,
    }),
  });
  const [destinatonlocation, setDestinationLocation] = useState({
    latitude: tripData.userLat || 31.470739629384877,
    longitude: tripData.userLong || 74.27279481051957,
  });

  const [tripCompleted, setTripCompleted] = useState(false);
  const [region, setRegion] = useState(mapRegion);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(true);

  useEffect(() => {
    getCurrentTrip(actions, requestData, setLoading);
    mapRef.current.animateCamera(
      {
        center: {
          latitude: region.latitude,
          longitude: region.longitude,
        },
        zoom: 18,
      },
      { duration: 10000 }
    );
  }, []);
  const handleLiveLocation = (data) => {
    //setLiveLocation({ latitude: data.latitude, longitude: data.longitude });
    var newCoordinate = new AnimatedRegion({
      latitude: data.latitude,
      longitude: data.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    });

    // liveLocation.timing(newCoordinate).start();
    liveLocation.coordinate
      .timing({
        latitude: data.latitude,
        longitude: data.longitude,
        useNativeDriver: false,
        duration: 1000,
      })
      .start();

    setLiveLocation({ coordinate: newCoordinate });
  };

  useEffect(() => {
    socket.on("locationTracking", (data) => {
      if (
        liveLocation.latitude !== data.latitude &&
        liveLocation.longitude !== data.longitude
      ) {
        handleLiveLocation(data);
      }
    });

    socket.on("completeTrip", (data) => {
      setIsCompleted(true);
      navigation.navigate(RouteNames.Payment, {
        requestId: requestData.requestId,
        tripData: tripData,
      });
    });
    return () => {
      socket.off("locationTracking");
      socket.off("completeTrip");
    };
  });
  return (
    <View style={styles.container}>
      <MapView
        pitchEnabled={true}
        ref={mapRef}
        showsUserLocation={true}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
      >
        <Marker
          coordinate={{
            latitude: sourcelocation.latitude,
            longitude: sourcelocation.longitude,
          }}
          title="source Location"
        >
          <Image source={LocationIcon} style={{ height: 40, width: 40 }} />
        </Marker>
        <Marker.Animated
          ref={trackingRef}
          coordinate={liveLocation.coordinate}
          title="driver Location"
        >
          <Image source={trackingMarker} style={{ height: 40, width: 40 }} />
        </Marker.Animated>
        <Marker
          coordinate={{
            latitude: destinatonlocation.latitude,
            longitude: destinatonlocation.longitude,
          }}
          title="destination Location"
        >
          <Image source={MapPin} style={{ height: 40, width: 40 }} />
        </Marker>
        <MapViewDirections
          origin={sourcelocation}
          destination={destinatonlocation}
          apikey={"AIzaSyBTfypSbx_zNMhWSBXMTA2BJBMQO7_9_T8"}
          strokeWidth={5}
          strokeColor={COLORS.SECONDARY_BLACK}
          precision="high"
          lineCap="butt"
        />
      </MapView>
      {loading ? (
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="red" />
        </View>
      ) : (
        <View style={styles.bottomContainer}>
          <View style={styles.headerBottom}>
            <View style={styles.profileImageContainer}>
              <Image
                resizeMode="contain"
                style={{ width: 60, height: 60 }}
                source={person}
              />
            </View>
            <View style={styles.profileContent}>
              <Text style={styles.headerText}>{tripData.driver.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image style={styles.icons} source={StarIcon} />
                <Text style={{ marginHorizontal: 2 }}>4.9</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(RouteNames.Chat, {
                    connectedDriver: tripData.driver,
                  })
                }
                style={styles.chatContainer}
              >
                <Image style={styles.icons} source={chatIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate(RouteNames.Call)}
                style={styles.callContainer}
              >
                <Image style={styles.icons} source={callIcon} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.bottomContent}>
            <View style={styles.pointContainer}>
              <View style={styles.locationShowContainer}>
                <Image style={styles.icons} source={LocationIcon} />
                <Text style={{ marginHorizontal: 10, fontSize: 15 }}>
                  {sourceAddress}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.locationShowContainer}>
                <Image style={styles.mapPin} source={MapPin} />
                <Text style={{ marginHorizontal: 10 }}>
                  {destinationAddress}
                </Text>
              </View>
              <View style={styles.divider} />
            </View>
            <View style={styles.carContainer}>
              <Image
                resizeMode="contain"
                style={styles.carImage}
                source={carImage}
              />
              <View style={styles.textContentContainer}>
                <View style={styles.textContainer}>
                  <Text style={{ color: COLORS.DISABLED_TEXT_GREY }}>
                    DISTANCE
                  </Text>
                  <Text>{`${parseInt(distance)} KM`}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={{ color: COLORS.DISABLED_TEXT_GREY }}>TIME</Text>
                  <Text>{`${parseInt(time)} min`}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={{ color: COLORS.DISABLED_TEXT_GREY }}>
                    PRICE
                  </Text>
                  <Text>{`${fare}`}</Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            disabled={!isCompleted}
            // onPress={() => navigation.pop(3)}
            onPress={() =>
              navigation.navigate(RouteNames.Payment, {
                requestId: requestData.requestId,
                tripData: tripData,
              })
            }
            style={
              isCompleted
                ? styles.buttonContainer
                : {
                    ...styles.buttonContainer,
                    backgroundColor: COLORS.DISABLED_BUTTON_GREY,
                  }
            }
          >
            <Text style={{ fontSize: 18 }}>Complete Trip</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
export default Tracking;

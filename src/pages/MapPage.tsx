import { useEffect, useRef, useState } from 'react';

import { Map, MapMarker, Polyline } from 'react-kakao-maps-sdk';
import { useNavigate } from 'react-router-dom';

import { OutlineButton, CircleButton, OutlineWhiteButton } from '../components/Button';
import { TopShadow } from '../components/TopShadow';
import { geolocation } from '../utils/getLocation';
import { Title } from '../components/Title';
import { CheckTrashPage } from './CheckTrash';
import { useDone } from '../hooks/useDone';


interface Location {
  lat: number | null;
  long: number | null;
}


function ImageCheckModal({ isOpen = false, children, close }: any) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100vh", display: isOpen ? "flex" : "none", backgroundColor: "#ffffff", zIndex: 100 }}>
      <CheckTrashPage close={close} />
      {children}
    </div>
  )
}


function MapPage() {
  const navigate = useNavigate();
  const { done, get } = useDone()


  const [firstLocation, setFirstLocation] = useState<Location>({
    lat: null,
    long: null,
  });
  const [nowLocation, setNowLocation] = useState<Location>({
    lat: null,
    long: null,
  });
  const [locationList, setLocationList] = useState<Array<Location>>([]);
  const [trashLocationList, setTrashLocationList] = useState<Array<Location>>(
    [],
  );

  const [moveLine, setMoveLine] = useState<any>();

  const [trashCount, setTrashCount] = useState(0);
  const [distance, setDistance] = useState(0);
  const [kcal, setKcal] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isClock, setIsClock] = useState(true);
  const timeRef = useRef<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false)


  const interval = 3000;
  const markerImage = '/marker.png';
  const trashMarkerImage = '/trash.jpeg';

  const imageShowSize = 30;
  const imageSize = { width: imageShowSize, height: imageShowSize };
  const spriteSize = { width: imageShowSize, height: imageShowSize };
  const storeOrigin = { x: 0, y: 0 };

  const calculateDistance = (
    coord1: { lat: number; long: number },
    coord2: { lat: number; long: number },
  ) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
    const dLon = (coord2.long - coord1.long) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
  };

  const getFirstLocation = async () => {
    const getLocation = await geolocation.get();
    if (getLocation) {
      setFirstLocation(getLocation);
      setNowLocation(getLocation);
      setLocationList([...locationList, getLocation]);
    }
  };

  const getGeoLocation = async () => {
    const getLocation = await geolocation.get();
    if (getLocation) {
      if (
        locationList.length === 0
          ? true
          : calculateDistance(
            locationList[locationList.length - 1],
            getLocation,
          ) < 50
      ) {
        setNowLocation(getLocation);
      }
    }
  };

  const getGeoLocationLength = () => {
    return Math.round(moveLine.getLength());
  };

  const addTrash = async () => {
    const getLocation = await geolocation.get();
    setTrashLocationList([
      ...trashLocationList,
      {
        long: getLocation?.long,
        lat: getLocation?.lat,
      },
    ]);
  };

  const calculateKcal = () => {
    const kg = 70;
    return (kg * distance) / 1000;
  };

  const startTimer = () => {
    timeRef.current = setInterval(() => {
      setDuration(time => time + 1000);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timeRef.current);
  };

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleClickTrash = () => {
    setTrashCount(trash => trash + 1);
    addTrash();
    setIsModalOpen(true)
  };

  const handleClickStopPlogging = () => {
    const createPloggingForm = {
      locationList,
      timer:
        Math.floor(duration / 60000) +
        ':' +
        ((duration % 60000) / 1000).toFixed(0).padStart(2, '0'),
      distance: (distance / 1000).toFixed(2),
      kcal: kcal,
    };
    done(createPloggingForm)
    console.log(createPloggingForm, get());
    navigate('/plogging/done');
  };

  const handleClickStopClock = () => {
    setIsClock(false);
    stopTimer();
  };

  const handleClickStartClock = () => {
    setIsClock(true);
    startTimer();
  };

  useEffect(() => {
    const initializeLocation = async () => {
      await getFirstLocation();
    };

    startTimer();
    initializeLocation();

    setInterval(() => {
      getGeoLocation();
    }, interval);

    return () => {
      stopTimer();
    };
  }, []);

  useEffect(() => {
    if (firstLocation.lat !== null && nowLocation.lat !== null) {
      if (
        locationList.length > 0
          ? calculateDistance(
            locationList[locationList.length - 1],
            nowLocation,
          ) < 50
          : true
      ) {
        setLocationList([...locationList, nowLocation]);
      }

      setDistance(getGeoLocationLength());
      setKcal(calculateKcal());
    }
  }, [nowLocation]);

  return (
    <>
      <Map
        center={{ lat: firstLocation.lat, lng: firstLocation.long }}
        style={{ width: '100%', height: '50vh' }}
      >
        <Polyline
          path={[
            locationList.map(item => {
              return { lat: item.lat, lng: item.long };
            }),
          ]}
          strokeWeight={10}
          strokeColor={'#7FD6E1'}
          strokeOpacity={1}
          strokeStyle={'solid'}
          onCreate={setMoveLine}
        />

        <MapMarker
          position={{ lat: nowLocation.lat, lng: nowLocation.long }}
          image={{
            src: markerImage,
            size: imageSize,
            options: {
              spriteSize: spriteSize,
              spriteOrigin: storeOrigin,
            },
          }}
        />

        {trashLocationList.map((trash: any) => (
          <MapMarker
            position={{ lat: trash.lat, lng: trash.long }}
            image={{
              src: trashMarkerImage,
              size: imageSize,
              options: {
                spriteSize: spriteSize,
                spriteOrigin: storeOrigin,
              },
            }}
          />
        ))}
      </Map>

      <b className='absolute left-2 top-2 z-10 hidden'>{trashCount}개의 쓰레기</b>

      <div className='relative bottom-0 left-0 z-10 h-1/2 w-full bg-white'>
        <TopShadow />

        <div className='flex pt-2 px-3 absolute' style={{ top: "0px" }}>
          <Title>플로깅으로 칼로리 태우는중</Title>
        </div>

        <div className='flex pt-2'>
          <div className='flex flex-1 justify-center flex-col items-center gap-2'>
            <b>
              {Math.floor(duration / 60000) +
                ':' +
                (duration < 10 ? '0' : '') +
                ((duration % 60000) / 1000).toFixed(0)}
            </b>
            <p style={{ color: "#828282" }}>시간</p>

          </div>
          <div className='flex flex-1 justify-center flex-col items-center gap-2'>
            <b style={{ fontSize: "1.5rem" }}>{kcal}kcal</b>
            <p>칼로리</p>
          </div>

          <div className='flex flex-1 justify-center flex-col items-center gap-2'>
            <b>{distance / 1000}km</b>
            <p style={{ color: "#828282" }}>거리</p>

          </div>
        </div>

        <div className='absolute bottom-6 flex w-full pt-2 gap-10'>
          <div className='flex flex-1 justify-end'>
            {isClock ? (
              <CircleButton onClick={handleClickStopClock}><span className="material-symbols-outlined">
                pause
              </span></CircleButton>
            ) : (
              <CircleButton color="#7FD6E1" onClick={handleClickStartClock}><span className="material-symbols-outlined">
                play_arrow
              </span></CircleButton>
            )}
          </div>
          <div className='flex flex-1 justify-start' style={{ display: "flex", alignItems: "center" }}>
            {isClock ? (
              <OutlineButton onClick={handleClickTrash}>쓰레기 주움</OutlineButton>

            ) : (
              <OutlineWhiteButton onClick={handleClickStopPlogging}>종료</OutlineWhiteButton>

            )}
          </div>
        </div>


      </div>
      <ImageCheckModal isOpen={isModalOpen} close={closeModal}>
        {/* <div>
            <CircleButton onClick={setIsModalOpen(() => !isModalOpen)}><span className="material-symbols-outlined">
              close
            </span></CircleButton>
          </div> */}
      </ImageCheckModal>
    </>
  );
}

export default MapPage
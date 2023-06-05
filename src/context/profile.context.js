import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../misc/firebase';
import { child, get, ref } from 'firebase/database';
import logoff from '../misc/logOut';

const profileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setisLoading] = useState(true);

    useEffect(() => {
        const authUnsub = auth.onAuthStateChanged(authObj => {
            if (authObj) {

                // Fetch Name And Profile Pic From DataBase
                get(child(ref(db), "admins/" + authObj.uid)).then((snapshot) => {
                    const user = snapshot.val();

                    if (user) {
                        const userProfileData = {
                            fullName: user.fullName,
                            uid: authObj.uid,
                            email: authObj.email,
                        }

                        setProfile(userProfileData);
                        setisLoading(false);
                    }
                    else {
                        alert('Admin Not Exists In Database');
                        throw Object.assign(new Error('Undef'), { code: 0 });
                    }
                }).catch((e) => {
                    logoff();
                    setProfile(null);
                    setisLoading(false);
                });
            } else {
                setProfile(null);
                setisLoading(false);
            }
        });

        return () => {
            authUnsub();
        };
    }, []);

    return (
        <profileContext.Provider value={{ profile, isLoading, setProfile }}>
            {children}
        </profileContext.Provider>
    );
};

export const useProfile = () => useContext(profileContext);

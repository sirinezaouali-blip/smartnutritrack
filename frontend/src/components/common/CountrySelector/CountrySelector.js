import React, { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import styles from './CountrySelector.module.css';

  // Complete countries with real flag images
export const countries = [
  {
    name: "Afghanistan",
    code: "AF",
    dial_code: "+93",
    flag: "https://flagcdn.com/w40/af.png"
  },
  {
    name: "Albania",
    code: "AL",
    dial_code: "+355",
    flag: "https://flagcdn.com/w40/al.png"
  },
  {
    name: "Algeria",
    code: "DZ",
    dial_code: "+213",
    flag: "https://flagcdn.com/w40/dz.png"
  },
  {
    name: "Andorra",
    code: "AD",
    dial_code: "+376",
    flag: "https://flagcdn.com/w40/ad.png"
  },
  {
    name: "Angola",
    code: "AO",
    dial_code: "+244",
    flag: "https://flagcdn.com/w40/ao.png"
  },
  {
    name: "Argentina",
    code: "AR",
    dial_code: "+54",
    flag: "https://flagcdn.com/w40/ar.png"
  },
  {
    name: "Armenia",
    code: "AM",
    dial_code: "+374",
    flag: "https://flagcdn.com/w40/am.png"
  },
  {
    name: "Australia",
    code: "AU",
    dial_code: "+61",
    flag: "https://flagcdn.com/w40/au.png"
  },
  {
    name: "Austria",
    code: "AT",
    dial_code: "+43",
    flag: "https://flagcdn.com/w40/at.png"
  },
  {
    name: "Azerbaijan",
    code: "AZ",
    dial_code: "+994",
    flag: "https://flagcdn.com/w40/az.png"
  },
  {
    name: "Bahrain",
    code: "BH",
    dial_code: "+973",
    flag: "https://flagcdn.com/w40/bh.png"
  },
  {
    name: "Bangladesh",
    code: "BD",
    dial_code: "+880",
    flag: "https://flagcdn.com/w40/bd.png"
  },
  {
    name: "Belarus",
    code: "BY",
    dial_code: "+375",
    flag: "https://flagcdn.com/w40/by.png"
  },
  {
    name: "Belgium",
    code: "BE",
    dial_code: "+32",
    flag: "https://flagcdn.com/w40/be.png"
  },
  {
    name: "Brazil",
    code: "BR",
    dial_code: "+55",
    flag: "https://flagcdn.com/w40/br.png"
  },
  {
    name: "Bulgaria",
    code: "BG",
    dial_code: "+359",
    flag: "https://flagcdn.com/w40/bg.png"
  },
  {
    name: "Canada",
    code: "CA",
    dial_code: "+1",
    flag: "https://flagcdn.com/w40/ca.png"
  },
  {
    name: "Chile",
    code: "CL",
    dial_code: "+56",
    flag: "https://flagcdn.com/w40/cl.png"
  },
  {
    name: "China",
    code: "CN",
    dial_code: "+86",
    flag: "https://flagcdn.com/w40/cn.png"
  },
  {
    name: "Colombia",
    code: "CO",
    dial_code: "+57",
    flag: "https://flagcdn.com/w40/co.png"
  },
  {
    name: "Croatia",
    code: "HR",
    dial_code: "+385",
    flag: "https://flagcdn.com/w40/hr.png"
  },
  {
    name: "Cyprus",
    code: "CY",
    dial_code: "+357",
    flag: "https://flagcdn.com/w40/cy.png"
  },
  {
    name: "Czech Republic",
    code: "CZ",
    dial_code: "+420",
    flag: "https://flagcdn.com/w40/cz.png"
  },
  {
    name: "Denmark",
    code: "DK",
    dial_code: "+45",
    flag: "https://flagcdn.com/w40/dk.png"
  },
  {
    name: "Egypt",
    code: "EG",
    dial_code: "+20",
    flag: "https://flagcdn.com/w40/eg.png"
  },
  {
    name: "Estonia",
    code: "EE",
    dial_code: "+372",
    flag: "https://flagcdn.com/w40/ee.png"
  },
  {
    name: "Finland",
    code: "FI",
    dial_code: "+358",
    flag: "https://flagcdn.com/w40/fi.png"
  },
  {
    name: "France",
    code: "FR",
    dial_code: "+33",
    flag: "https://flagcdn.com/w40/fr.png"
  },
  {
    name: "Germany",
    code: "DE",
    dial_code: "+49",
    flag: "https://flagcdn.com/w40/de.png"
  },
  {
    name: "Ghana",
    code: "GH",
    dial_code: "+233",
    flag: "https://flagcdn.com/w40/gh.png"
  },
  {
    name: "Greece",
    code: "GR",
    dial_code: "+30",
    flag: "https://flagcdn.com/w40/gr.png"
  },
  {
    name: "Hong Kong",
    code: "HK",
    dial_code: "+852",
    flag: "https://flagcdn.com/w40/hk.png"
  },
  {
    name: "Hungary",
    code: "HU",
    dial_code: "+36",
    flag: "https://flagcdn.com/w40/hu.png"
  },
  {
    name: "Iceland",
    code: "IS",
    dial_code: "+354",
    flag: "https://flagcdn.com/w40/is.png"
  },
  {
    name: "India",
    code: "IN",
    dial_code: "+91",
    flag: "https://flagcdn.com/w40/in.png"
  },
  {
    name: "Indonesia",
    code: "ID",
    dial_code: "+62",
    flag: "https://flagcdn.com/w40/id.png"
  },
  {
    name: "Iran",
    code: "IR",
    dial_code: "+98",
    flag: "https://flagcdn.com/w40/ir.png"
  },
  {
    name: "Iraq",
    code: "IQ",
    dial_code: "+964",
    flag: "https://flagcdn.com/w40/iq.png"
  },
  {
    name: "Ireland",
    code: "IE",
    dial_code: "+353",
    flag: "https://flagcdn.com/w40/ie.png"
  },
  {
    name: "Italy",
    code: "IT",
    dial_code: "+39",
    flag: "https://flagcdn.com/w40/it.png"
  },
  {
    name: "Japan",
    code: "JP",
    dial_code: "+81",
    flag: "https://flagcdn.com/w40/jp.png"
  },
  {
    name: "Jordan",
    code: "JO",
    dial_code: "+962",
    flag: "https://flagcdn.com/w40/jo.png"
  },
  {
    name: "Kenya",
    code: "KE",
    dial_code: "+254",
    flag: "https://flagcdn.com/w40/ke.png"
  },
  {
    name: "Kuwait",
    code: "KW",
    dial_code: "+965",
    flag: "https://flagcdn.com/w40/kw.png"
  },
  {
    name: "Latvia",
    code: "LV",
    dial_code: "+371",
    flag: "https://flagcdn.com/w40/lv.png"
  },
  {
    name: "Lebanon",
    code: "LB",
    dial_code: "+961",
    flag: "https://flagcdn.com/w40/lb.png"
  },
  {
    name: "Lithuania",
    code: "LT",
    dial_code: "+370",
    flag: "https://flagcdn.com/w40/lt.png"
  },
  {
    name: "Luxembourg",
    code: "LU",
    dial_code: "+352",
    flag: "https://flagcdn.com/w40/lu.png"
  },
  {
    name: "Malaysia",
    code: "MY",
    dial_code: "+60",
    flag: "https://flagcdn.com/w40/my.png"
  },
  {
    name: "Mexico",
    code: "MX",
    dial_code: "+52",
    flag: "https://flagcdn.com/w40/mx.png"
  },
  {
    name: "Morocco",
    code: "MA",
    dial_code: "+212",
    flag: "https://flagcdn.com/w40/ma.png"
  },
  {
    name: "Netherlands",
    code: "NL",
    dial_code: "+31",
    flag: "https://flagcdn.com/w40/nl.png"
  },
  {
    name: "New Zealand",
    code: "NZ",
    dial_code: "+64",
    flag: "https://flagcdn.com/w40/nz.png"
  },
  {
    name: "Nigeria",
    code: "NG",
    dial_code: "+234",
    flag: "https://flagcdn.com/w40/ng.png"
  },
  {
    name: "Norway",
    code: "NO",
    dial_code: "+47",
    flag: "https://flagcdn.com/w40/no.png"
  },
  {
    name: "Oman",
    code: "OM",
    dial_code: "+968",
    flag: "https://flagcdn.com/w40/om.png"
  },
  {
    name: "Pakistan",
    code: "PK",
    dial_code: "+92",
    flag: "https://flagcdn.com/w40/pk.png"
  },
  {
    name: "Philippines",
    code: "PH",
    dial_code: "+63",
    flag: "https://flagcdn.com/w40/ph.png"
  },
  {
    name: "Poland",
    code: "PL",
    dial_code: "+48",
    flag: "https://flagcdn.com/w40/pl.png"
  },
  {
    name: "Portugal",
    code: "PT",
    dial_code: "+351",
    flag: "https://flagcdn.com/w40/pt.png"
  },
  {
    name: "Qatar",
    code: "QA",
    dial_code: "+974",
    flag: "https://flagcdn.com/w40/qa.png"
  },
  {
    name: "Romania",
    code: "RO",
    dial_code: "+40",
    flag: "https://flagcdn.com/w40/ro.png"
  },
  {
    name: "Russia",
    code: "RU",
    dial_code: "+7",
    flag: "https://flagcdn.com/w40/ru.png"
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    dial_code: "+966",
    flag: "https://flagcdn.com/w40/sa.png"
  },
  {
    name: "Singapore",
    code: "SG",
    dial_code: "+65",
    flag: "https://flagcdn.com/w40/sg.png"
  },
  {
    name: "Slovakia",
    code: "SK",
    dial_code: "+421",
    flag: "https://flagcdn.com/w40/sk.png"
  },
  {
    name: "Slovenia",
    code: "SI",
    dial_code: "+386",
    flag: "https://flagcdn.com/w40/si.png"
  },
  {
    name: "South Africa",
    code: "ZA",
    dial_code: "+27",
    flag: "https://flagcdn.com/w40/za.png"
  },
  {
    name: "South Korea",
    code: "KR",
    dial_code: "+82",
    flag: "https://flagcdn.com/w40/kr.png"
  },
  {
    name: "Spain",
    code: "ES",
    dial_code: "+34",
    flag: "https://flagcdn.com/w40/es.png"
  },
  {
    name: "Sweden",
    code: "SE",
    dial_code: "+46",
    flag: "https://flagcdn.com/w40/se.png"
  },
  {
    name: "Switzerland",
    code: "CH",
    dial_code: "+41",
    flag: "https://flagcdn.com/w40/ch.png"
  },
  {
    name: "Taiwan",
    code: "TW",
    dial_code: "+886",
    flag: "https://flagcdn.com/w40/tw.png"
  },
  {
    name: "Thailand",
    code: "TH",
    dial_code: "+66",
    flag: "https://flagcdn.com/w40/th.png"
  },
  {
    name: "Tunisia",
    code: "TN",
    dial_code: "+216",
    flag: "https://flagcdn.com/w40/tn.png"
  },
  {
    name: "Turkey",
    code: "TR",
    dial_code: "+90",
    flag: "https://flagcdn.com/w40/tr.png"
  },
  {
    name: "Ukraine",
    code: "UA",
    dial_code: "+380",
    flag: "https://flagcdn.com/w40/ua.png"
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    dial_code: "+971",
    flag: "https://flagcdn.com/w40/ae.png"
  },
  {
    name: "United Kingdom",
    code: "GB",
    dial_code: "+44",
    flag: "https://flagcdn.com/w40/gb.png"
  },
  {
    name: "United States",
    code: "US",
    dial_code: "+1",
    flag: "https://flagcdn.com/w40/us.png"
  },
  {
    name: "Vietnam",
    code: "VN",
    dial_code: "+84",
    flag: "https://flagcdn.com/w40/vn.png"
  }
];

// Default country (France)
export const defaultCountry = {
  name: "France",
  code: "FR",
  dial_code: "+33",
  flag: "https://flagcdn.com/w40/fr.png"
};

const CountrySelector = ({ value, onChange, placeholder = "Select country" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Now you can use the countries array inside your component
  const selectedCountry = value ? countries.find(country => country.dial_code === value) : defaultCountry;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCountrySelect = (country) => {
    onChange(country.dial_code);
    setIsOpen(false);
  };

  return (
    <div className={styles.countrySelector}>
      <div 
        className={styles.selectedCountry} 
        onClick={toggleDropdown}
      >
        {selectedCountry && (
          <>
            <img 
              src={selectedCountry.flag} 
              alt={selectedCountry.name}
              className={styles.flag}
            />
            <span className={styles.dialCode}>
              {selectedCountry.dial_code}
            </span>
          </>
        )}
        <FiChevronDown className={styles.chevron} />
      </div>
      
      {isOpen && (
        <div className={styles.dropdown}>
          {countries.map((country) => (
            <div
              key={country.code}
              className={styles.countryOption}
              onClick={() => handleCountrySelect(country)}
            >
              <img 
                src={country.flag} 
                alt={country.name}
                className={styles.flag}
              />
              <span className={styles.countryName}>{country.name}</span>
              <span className={styles.dialCode}>{country.dial_code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plus, Minus } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#BFD8D5' }}>
      {/* Header */}
      <header className="bg-white px-24 py-4">
        <div className="flex items-center justify-between">
          <div className="w-[100px] h-[100px] rounded-full bg-gray-200 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-300"></div>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="bg-black text-white px-8 py-3 text-base font-semibold hover:bg-gray-800"
          >
            SIGN IN
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex">
        <div className="flex-1 bg-[#F2ECEC] flex flex-col justify-center items-center px-12 py-16">
          <div className="max-w-lg text-center">
            <h1 className="text-5xl font-semibold text-[#262626] leading-tight mb-10" style={{ fontFamily: 'Poppins, sans-serif' }}>
              The only Alumni Management Cell of IIIT Naya Raipur
            </h1>
            <Button
              onClick={() => navigate("/signup")}
              className="bg-black text-white px-8 py-4 text-xl font-semibold hover:bg-gray-800"
            >
              Register
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/142d20af3ecfbce5a7d26256ab9a64383258c0bc?width=1440"
            alt="IIIT Naya Raipur Campus"
            className="w-full h-[464px] object-cover"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#DFDFDF] py-16">
        <div className="max-w-7xl mx-auto px-12 flex items-center gap-32">
          <div className="w-[509px]">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/d1b4741959c2c4c372f87a133583ec97610bdefc?width=1018"
              alt="Features illustration"
              className="w-full h-auto"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-semibold text-[#262626] mb-12" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Why Join The Alumni Cell
            </h2>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#266055]" />
                <span className="text-[32px] font-semibold text-[#424242]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Connect with 1000+ Alumnis
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#266055]" />
                <span className="text-[32px] font-semibold text-[#424242]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Across 100+ companies
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#266055]" />
                <span className="text-[32px] font-semibold text-[#424242]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Re-connect with cohorts
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-[#266055]" />
                <span className="text-[32px] font-semibold text-[#424242]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  Get insight into different industries
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-[#F8F8F8] py-16">
        <div className="max-w-7xl mx-auto px-12">
          <h2 className="text-4xl font-semibold text-[#262626] text-center mb-12" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Benefits Of Being Part Of The Cell
          </h2>

          <div className="bg-[#F7F7F5] rounded-lg p-8 mb-12">
            <div className="flex items-center justify-center gap-16">
              <div className="w-px h-10 bg-[#B9B9B9]"></div>
              <div className="text-center">
                <h3 className="text-4xl font-semibold text-[#262626]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Access the<br />community
                </h3>
              </div>
              <div className="w-px h-10 bg-[#B9B9B9]"></div>
              <div className="text-center">
                <h3 className="text-4xl font-semibold text-[#262626]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Build lasting<br />connections
                </h3>
              </div>
              <div className="w-px h-10 bg-[#B9B9B9]"></div>
              <div className="text-center">
                <h3 className="text-4xl font-semibold text-[#262626]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Secure carrier<br />opportunities
                </h3>
              </div>
            </div>
          </div>

          <div className="w-full">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/1f739d8a5e280486134cb1ffa8ddd6b533008d7e?width=2320"
              alt="Benefits illustration"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[#F8F8F8] py-16">
        <div className="max-w-7xl mx-auto px-32 flex items-center justify-between gap-16">
          <div className="w-[466px] h-[466px] bg-[#D9D9D9] rounded-lg"></div>
          <div className="w-[563px]">
            <h2 className="text-3xl font-semibold text-[#262626] text-center mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpenFaq(openFaq === 1 ? 0 : 1)}>
                  <span className="text-base font-medium text-[#262626]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    What is this Alumni Tracking Website for?
                  </span>
                  {openFaq === 1 ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </div>
                {openFaq === 1 && (
                  <p className="mt-3 text-base text-[#606060]" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    It's a platform to connect alumni with their alma mater and fellow graduates. You can update your profile, track career progress, and stay connected with the community.
                  </p>
                )}
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpenFaq(openFaq === 2 ? 0 : 2)}>
                  <span className="text-base font-medium text-[#262626]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Who can register on the website?
                  </span>
                  <Plus className="w-3 h-3" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpenFaq(openFaq === 3 ? 0 : 3)}>
                  <span className="text-base font-medium text-[#262626]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Do I need to pay to use the website?
                  </span>
                  <Plus className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-[#262626] px-12 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-3xl font-medium mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Need more information?
            </h2>
            <p className="text-xl" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Write your concern to us and our specialist will get back to you.
            </p>
          </div>
          <Button className="bg-white text-[#262626] px-8 py-4 text-2xl font-semibold hover:bg-gray-100">
            help@gmail.com
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white px-24 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-[#262626] mb-4 opacity-60" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Alumni Management Cell<br />IIIT Naya Raipur
            </h3>
          </div>
          <div>
            <h4 className="text-xl font-medium text-[#262626] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Address
            </h4>
            <p className="text-base font-semibold text-[#272D2C] opacity-60" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              IIIT–Naya Raipur Plot No. 7, Sector 24,<br />
              Near Purkhoti Muktangan , Atal Nagar – 493661<br />
              Chhattisgarh
            </p>
          </div>
          <div>
            <h4 className="text-xl font-medium text-[#262626] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Visit official college<br />website
            </h4>
            <a href="#" className="text-xl text-[#272D2C] opacity-60 underline" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Link here
            </a>
          </div>
          <div>
            <h4 className="text-xl font-medium text-[#262626] mb-5" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Connect with us
            </h4>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

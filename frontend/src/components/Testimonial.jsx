import React, { useEffect, useRef, useState } from "react";
import { testimonialStyles } from "../assets/dummyStyles";
import { ShieldCheck, Star, Stethoscope } from "lucide-react";

const Testimonial = () => {
  const scrollRefLeft = useRef(null);
  const scrollRefRight = useRef(null);
  const [isLeftPaused, setIsLeftPaused] = useState(false);
  const [isRightPaused, setIsRightPaused] = useState(false);

  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Cardiologist",
      rating: 5,
      text: "The appointment booking system is incredibly efficient. It saves me valuable time and helps me focus on patient care.",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Patient",
      rating: 5,
      text: "Scheduling appointments has never been easier. The interface is intuitive and reminders are very helpful!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 3,
      name: "Dr. Robert Martinez",
      role: "Pediatrician",
      rating: 4,
      text: "This platform has streamlined our clinic operations significantly. Patient management is much more organized.",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 4,
      name: "Emily Williams",
      role: "Patient",
      rating: 5,
      text: "Booking appointments online 24/7 is a game-changer. The confirmation system gives me peace of mind.",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 5,
      name: "Dr. Amanda Lee",
      role: "Dermatologist",
      rating: 5,
      text: "Excellent platform for managing appointments. Automated reminders reduce no-shows dramatically.",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 6,
      name: "David Thompson",
      role: "Patient",
      rating: 5,
      text: "The wait time has reduced significantly since using this platform. Very convenient and user-friendly!",
      image:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 7,
      name: "Dr. Priya Nair",
      role: "Neurologist",
      rating: 5,
      text: "Smart scheduling and instant updates have reduced front-desk load and improved patient flow in our neurology unit.",
      image:
        "https://images.unsplash.com/photo-1612276529731-4b21494e6d71?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 8,
      name: "Aisha Khan",
      role: "Patient",
      rating: 5,
      text: "I can compare doctor availability quickly and book without calls. The reminders helped me never miss follow-ups.",
      image:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 9,
      name: "Dr. James O'Connor",
      role: "Orthopedic Surgeon",
      rating: 4,
      text: "Consultation slots are managed better now, and patient records are more accessible during busy clinic hours.",
      image:
        "https://images.unsplash.com/photo-1612276529731-4b21494e6d71?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 10,
      name: "Riya Sharma",
      role: "Patient",
      rating: 5,
      text: "The interface is clean and fast. Booking dermatology appointments for my family takes less than two minutes.",
      image:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 11,
      name: "Dr. Hassan Ali",
      role: "ENT Specialist",
      rating: 5,
      text: "Patient queues are much more structured. The platform has improved both attendance and consultation preparedness.",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 12,
      name: "Carlos Mendez",
      role: "Patient",
      rating: 4,
      text: "The reschedule option is very helpful for my work shifts. Notifications are clear and always on time.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 13,
      name: "Dr. Elena Petrova",
      role: "Gynecologist",
      rating: 5,
      text: "Coordination between staff and patients is smoother. Appointment confirmations have reduced no-shows substantially.",
      image:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 14,
      name: "Noah Bennett",
      role: "Patient",
      rating: 5,
      text: "I like how quickly I can find specialists and secure slots. The whole experience feels modern and stress-free.",
      image:
        "https://images.unsplash.com/photo-1612276529731-4b21494e6d71?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
    {
      id: 15,
      name: "Dr. Kavita Rao",
      role: "Oncologist",
      rating: 5,
      text: "Follow-up care scheduling is now seamless. Automated communication keeps patients informed at every step.",
      image:
        "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=400&q=80",
      type: "doctor",
    },
    {
      id: 16,
      name: "Sophia Turner",
      role: "Patient",
      rating: 5,
      text: "From search to booking to reminders, everything is smooth. It makes healthcare visits much easier to manage.",
      image:
        "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=400&q=80",
      type: "patient",
    },
  ];

  const leftTestimonials = testimonials.filter((t) => t.type === "doctor");
  const rightTestimonials = testimonials.filter((t) => t.type === "patient");

  useEffect(() => {
    const scrollLeft = scrollRefLeft.current;
    const scrollRight = scrollRefRight.current;
    if (!scrollLeft || !scrollRight) return;

    let scrollSpeed = 0.5; // preserved animation speed
    let rafId;

    const smoothScroll = () => {
      if (!isLeftPaused) {
        scrollLeft.scrollTop += scrollSpeed;

        // seamless infinite loop
        if (scrollLeft.scrollTop >= scrollLeft.scrollHeight / 2) {
          scrollLeft.scrollTop = 0;
        }
      }

      if (!isRightPaused) {
        scrollRight.scrollTop -= scrollSpeed;
        if (scrollRight.scrollTop <= 0) {
          scrollRight.scrollTop = scrollRight.scrollHeight / 2;
        }
      }
      rafId = requestAnimationFrame(smoothScroll);
    };

    rafId = requestAnimationFrame(smoothScroll);
    return () => cancelAnimationFrame(rafId);
  }, [isLeftPaused, isRightPaused]);

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={
          i < rating
            ? testimonialStyles.activeStar
            : testimonialStyles.inactiveStar
        }
      >
        <Star className={testimonialStyles.star} />
      </span>
    ));

  const TestimonialCard = ({ testimonial, direction }) => (
    <div
      className={`${testimonialStyles.testimonialCard} ${
        direction === "left"
          ? testimonialStyles.leftCardBorder
          : testimonialStyles.rightCardBorder
      }`}
    >
      <div className={testimonialStyles.cardContent}>
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className={testimonialStyles.avatar}
        />
        <div className={testimonialStyles.textContainer}>
          <div className={testimonialStyles.nameRoleContainer}>
            <div>
              <h4
                className={`${testimonialStyles.name} ${
                  direction === "left"
                    ? testimonialStyles.leftName
                    : testimonialStyles.rightName
                }`}
              >
                {testimonial.name}
              </h4>
              <p className={testimonialStyles.role}>{testimonial.role}</p>
            </div>
            <div className={testimonialStyles.starsContainer}>
              {renderStars(testimonial.rating)}
            </div>
          </div>

          <p className={testimonialStyles.quote}>"{testimonial.text}"</p>

          {/* Stars on small screens beneath text */}
          <div className={testimonialStyles.mobileStarsContainer}>
            {renderStars(testimonial.rating)}
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className={testimonialStyles.container}>
      <div className="ts-orb ts-orb-left"></div>
      <div className="ts-orb ts-orb-right"></div>
      <div className={testimonialStyles.headerContainer}>
        <h2 className={testimonialStyles.title}>Voices of Trust</h2>
        <p className={testimonialStyles.subtitle}>
          Real stories from doctors and patients sharing their positive
          experiences with our healthcare platform.
        </p>
      </div>

      <div className={testimonialStyles.grid}>
        <div
          className={`${testimonialStyles.columnContainer} ${testimonialStyles.leftColumnBorder}`}
        >
          <div
            className={`${testimonialStyles.columnHeader} ${
              testimonialStyles.leftColumnHeader
            }`}
          >
            <span className={testimonialStyles.columnHeaderInner}>
              <Stethoscope className="w-4 h-4" />
              Medical Professionals
            </span>
          </div>

          <div
            onMouseEnter={() => setIsLeftPaused(true)}
            onMouseLeave={() => setIsLeftPaused(false)}
            onTouchStart={() => setIsLeftPaused(true)}
            onTouchEnd={() => setIsLeftPaused(false)}
            ref={scrollRefLeft}
            className={testimonialStyles.scrollContainer}
          >
            {[...leftTestimonials, ...leftTestimonials].map((t, i) => (
              <TestimonialCard
                key={`L-${i}`}
                testimonial={t}
                direction="left"
              />
            ))}
          </div>
        </div>

        <div
          className={`${testimonialStyles.columnContainer} ${testimonialStyles.rightColumnBorder}`}
        >
          <div
            className={`${testimonialStyles.columnHeader} ${testimonialStyles.rightColumnHeader}`}
          >
            <span className={testimonialStyles.columnHeaderInner}>
              <ShieldCheck className="w-4 h-4" />
              Patients
            </span>
          </div>

          <div
            ref={scrollRefRight}
            className={testimonialStyles.scrollContainer}
            onMouseEnter={() => setIsRightPaused(true)}
            onMouseLeave={() => setIsRightPaused(false)}
            onTouchStart={() => setIsRightPaused(true)}
            onTouchEnd={() => setIsRightPaused(false)}
          >
            {[...rightTestimonials, ...rightTestimonials].map((t, i) => (
              <TestimonialCard
                key={`R-${i}`}
                testimonial={t}
                direction="right"
              />
            ))}
          </div>
        </div>
      </div>

      <style>{testimonialStyles.animationStyles}</style>
    </div>
  );
};

export default Testimonial;
